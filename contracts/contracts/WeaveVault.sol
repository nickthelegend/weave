// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
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
contract WeaveVault is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable depositToken;
    uint256 public totalDeposited;
    uint256 public totalShares;

    mapping(address => uint256) public userShares;
    
    IWeavifyStrategy public strategy;
    address public treasury;
    address public keeper;
    IInitiaDEX public dex;

    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public performanceFee = 1000; // 10%
    
    uint256 public totalYieldGenerated;

    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount, uint256 shares);
    event StrategyUpdated(address indexed strategy);
    event Harvested(uint256 netYield, uint256 fee, uint256 timestamp);
    event KeeperUpdated(address indexed keeper);
    event ExternalRewardsClaimed(uint256 amountSwapped, uint256 fee);

    modifier onlyKeeper() {
        require(msg.sender == keeper || msg.sender == owner(), "Not keeper");
        _;
    }

    constructor(address _depositToken, address _treasury, address _dex) Ownable(msg.sender) {
        depositToken = IERC20(_depositToken);
        treasury = _treasury;
        keeper = msg.sender;
        dex = IInitiaDEX(_dex);
    }

    function setStrategy(address _strategy) external onlyOwner {
        strategy = IWeavifyStrategy(_strategy);
        emit StrategyUpdated(_strategy);
    }

    function setKeeper(address _keeper) external onlyOwner {
        keeper = _keeper;
        emit KeeperUpdated(_keeper);
    }

    function setDex(address _dex) external onlyOwner {
        dex = IInitiaDEX(_dex);
    }

    function deposit(uint256 amount) external {
        _depositFor(msg.sender, amount);
    }

    function depositFor(address user, uint256 amount) external nonReentrant whenNotPaused {
        _depositFor(user, amount);
    }

    function _depositFor(address user, uint256 amount) internal {
        require(amount > 0, "Amount must be > 0");

        uint256 shares;
        if (totalShares == 0) {
            shares = amount;
        } else {
            shares = (amount * totalShares) / totalDeposited;
        }

        depositToken.safeTransferFrom(msg.sender, address(this), amount);

        // Supply to strategy
        if (address(strategy) != address(0)) {
            depositToken.safeIncreaseAllowance(address(strategy), amount);
            strategy.deposit(amount);
        }

        userShares[user] += shares;
        totalShares += shares;
        totalDeposited += amount;

        emit Deposited(user, amount, shares);
    }

    function withdraw(uint256 shareAmount) external nonReentrant whenNotPaused {
        require(shareAmount > 0, "Share amount must be > 0");
        require(userShares[msg.sender] >= shareAmount, "Insufficient shares");

        uint256 usdcAmount = (shareAmount * totalDeposited) / totalShares;

        // Withdraw from strategy
        if (address(strategy) != address(0)) {
            strategy.withdraw(usdcAmount);
        }

        userShares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;
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
        if (totalShares == 0) return 0;
        return (userShares[user] * totalDeposited) / totalShares;
    }

    function getPricePerShare() public view returns (uint256) {
        if (totalShares == 0) return 1e6; // 1 USDC (6 decimals)
        return (totalDeposited * 1e6) / totalShares;
    }

    function getVaultStats() external view returns (
        uint256 _totalDeposited,
        uint256 _totalShares,
        uint256 _totalYieldGenerated,
        uint256 _pricePerShare
    ) {
        return (
            totalDeposited,
            totalShares,
            totalYieldGenerated,
            getPricePerShare()
        );
    }
}

