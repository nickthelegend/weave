// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./IWeavifyStrategy.sol";

interface IInitiaDEX {
    function swapExactTokensForTokens(
        uint256 amountIn, 
        uint256 amountOutMin, 
        address[] calldata path, 
        address to
    ) external returns (uint256[] memory amounts);
}

/**
 * @title WeaveVault
 * @dev Main vault for Weave - aggregates yield on Initia.
 */
contract WeaveVault is ERC20, ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable depositToken;
    uint256 public totalDeposited;
    uint256 public maxTVL = 1_000_000 * 1e6; // $1M USDC cap
    
    // totalShares is now totalSupply()
    
    IWeavifyStrategy public strategy;
    address public treasury;
    address public keeper;
    IInitiaDEX public dex;

    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public performanceFee = 1000; // 10%
    
    uint256 public totalYieldGenerated;
    uint256 public pricePerShare = 1e6; // Default 1.0

    address[] public depositorsList;
    mapping(address => bool) private _isDepositor;

    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount, uint256 shares);
    event StrategyUpdated(address indexed strategy);
    event Harvested(uint256 netYield, uint256 fee, uint256 timestamp);
    event KeeperUpdated(address indexed keeper);
    event ExternalRewardsClaimed(uint256 amountSwapped, uint256 fee);
    event SharePriceUpdated(uint256 newPrice, uint256 timestamp);

    modifier onlyKeeper() {
        require(msg.sender == keeper || msg.sender == owner(), "Not keeper");
        _;
    }

    constructor(address _depositToken, address _treasury, address _dex) 
        ERC20("Weave Yield USDC", "wUSDC") 
        Ownable(msg.sender) 
    {
        depositToken = IERC20(_depositToken);
        treasury = _treasury;
        keeper = msg.sender;
        dex = IInitiaDEX(_dex);
    }

    // --- Keeper Functions ---

    function updateSharePrice(uint256 newPricePerShare) external onlyKeeper {
        pricePerShare = newPricePerShare;
        // Also update totalDeposited to match the new PPS for accounting
        if (totalSupply() > 0) {
            totalDeposited = (totalSupply() * newPricePerShare) / 1e6;
        }
        emit SharePriceUpdated(newPricePerShare, block.timestamp);
    }

    function setStrategy(address _strategy) external onlyOwner {
        strategy = IWeavifyStrategy(_strategy);
        emit StrategyUpdated(_strategy);
    }

    function setKeeper(address _keeper) external onlyOwner {
        keeper = _keeper;
        emit KeeperUpdated(_keeper);
    }

    function setMaxTVL(uint256 _maxTVL) external onlyOwner {
        maxTVL = _maxTVL;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setDex(address _dex) external onlyOwner {
        dex = IInitiaDEX(_dex);
    }

    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        _depositFor(msg.sender, amount);
    }

    function depositFor(address user, uint256 amount) external nonReentrant whenNotPaused {
        _depositFor(user, amount);
    }

    function _depositFor(address user, uint256 amount) internal {
        require(amount > 0, "Amount must be > 0");
        require(totalDeposited + amount <= maxTVL, "Cap reached");

        uint256 shares;
        if (totalSupply() == 0) {
            shares = amount;
        } else {
            shares = (amount * totalSupply()) / totalDeposited;
        }

        depositToken.safeTransferFrom(msg.sender, address(this), amount);

        // Supply to strategy
        if (address(strategy) != address(0)) {
            depositToken.safeIncreaseAllowance(address(strategy), amount);
            strategy.deposit(amount);
        }

        if (!_isDepositor[user]) {
            depositorsList.push(user);
            _isDepositor[user] = true;
        }

        _mint(user, shares);
        totalDeposited += amount;

        emit Deposited(user, amount, shares);
    }

    function withdraw(uint256 shareAmount, uint256 minOut) external nonReentrant whenNotPaused {
        require(shareAmount > 0, "Share amount must be > 0");
        require(balanceOf(msg.sender) >= shareAmount, "Insufficient shares");

        uint256 usdcAmount = (shareAmount * totalDeposited) / totalSupply();
        require(usdcAmount >= minOut, "Slippage exceeded");

        // Withdraw from strategy
        if (address(strategy) != address(0)) {
            strategy.withdraw(usdcAmount);
        }

        _burn(msg.sender, shareAmount);
        totalDeposited -= usdcAmount;

        depositToken.safeTransfer(msg.sender, usdcAmount);

        emit Withdrawn(msg.sender, usdcAmount, shareAmount);
    }

    /**
     * @dev Triggered by keeper to harvest yield from strategies.
     */
    function harvest() external onlyKeeper whenNotPaused {
        require(address(strategy) != address(0), "No strategy");
        
        uint256 netYield = strategy.harvest();
        
        // Update vault state
        totalYieldGenerated += netYield;
        totalDeposited += netYield;
        
        emit Harvested(netYield, 0, block.timestamp);
    }

    /**
     * @dev Handles secondary reward tokens (INIT, esINIT, etc)
     * Swaps them to USDC, takes performance fee, and reinvests.
     */
    function claimExternalRewards(address[] calldata rewardTokens) external onlyKeeper {
        uint256 totalSwappedToUsdc = 0;

        for (uint256 i = 0; i < rewardTokens.length; i++) {
            address token = rewardTokens[i];
            uint256 balance = IERC20(token).balanceOf(address(this));
            
            if (balance > 0) {
                IERC20(token).safeIncreaseAllowance(address(dex), balance);
                
                address[] memory path = new address[](2);
                path[0] = token;
                path[1] = address(depositToken);
                
                uint256[] memory amounts = dex.swapExactTokensForTokens(
                    balance, 
                    0, 
                    path, 
                    address(this)
                );
                totalSwappedToUsdc += amounts[amounts.length - 1];
            }
        }

        if (totalSwappedToUsdc > 0) {
            uint256 fee = (totalSwappedToUsdc * performanceFee) / FEE_DENOMINATOR;
            uint256 netAmount = totalSwappedToUsdc - fee;

            if (fee > 0) {
                depositToken.safeTransfer(treasury, fee);
            }

            // Reinvest into strategy
            if (address(strategy) != address(0)) {
                depositToken.safeIncreaseAllowance(address(strategy), netAmount);
                strategy.deposit(netAmount);
            }

            totalYieldGenerated += netAmount;
            totalDeposited += netAmount;

            emit ExternalRewardsClaimed(totalSwappedToUsdc, fee);
        }
    }

    function getUserValue(address user) public view returns (uint256) {
        if (totalSupply() == 0) return 0;
        return (balanceOf(user) * totalDeposited) / totalSupply();
    }

    // Called by keeper/vip.ts to get depositor list
    function getTopDepositors(uint256 limit) 
        external view returns (
            address[] memory depositors,
            uint256[] memory balances
        ) {
            uint256 count = depositorsList.length > limit ? limit : depositorsList.length;
            depositors = new address[](count);
            balances = new uint256[](count);
            for (uint256 i = 0; i < count; i++) {
                depositors[i] = depositorsList[i];
                balances[i] = balanceOf(depositors[i]);
            }
    }

    // VIP score = shares held
    function getUserScore(address user) 
        external view returns (uint256) {
            return balanceOf(user);
    }

    function getPricePerShare() public view returns (uint256) {
        if (totalSupply() == 0) return 1e6; // 1 USDC (6 decimals)
        return (totalDeposited * 1e6) / totalSupply();
    }

    function getVaultStats() external view returns (
        uint256 _totalDeposited,
        uint256 _totalShares,
        uint256 _totalYieldGenerated,
        uint256 _pricePerShare
    ) {
        return (
            totalDeposited,
            totalSupply(),
            totalYieldGenerated,
            getPricePerShare()
        );
    }
}


