// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IWeaveRewards {
    function distributeRewards(uint256 usdcAmount) external;
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
    mapping(address => uint256) public depositTimestamp;

    address public keeper;
    uint256 public protocolFee = 1000; // 10% in basis points
    address public feeRecipient; // future WEAVE staking contract (WeaveRewards)
    uint256 public totalProtocolFeesAccrued;
    uint256 public totalYieldGenerated;

    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount, uint256 shares);
    event Harvested(uint256 netYield, uint256 fee, uint256 timestamp);
    event KeeperUpdated(address indexed keeper);
    event FeeRecipientUpdated(address indexed recipient);
    event FeeSent(uint256 amount);

    modifier onlyKeeper() {
        require(msg.sender == keeper || msg.sender == owner(), "Not keeper");
        _;
    }

    constructor(address _depositToken) Ownable(msg.sender) {
        depositToken = IERC20(_depositToken);
        keeper = msg.sender;
        feeRecipient = msg.sender;
    }

    function setPaused(bool _paused) external onlyOwner {
        if (_paused) _pause();
        else _unpause();
    }

    function setKeeper(address _keeper) external onlyOwner {
        keeper = _keeper;
        emit KeeperUpdated(_keeper);
    }

    function setFeeRecipient(address _recipient) external onlyOwner {
        feeRecipient = _recipient;
        emit FeeRecipientUpdated(_recipient);
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

        userShares[user] += shares;
        totalShares += shares;
        totalDeposited += amount;
        depositTimestamp[user] = block.timestamp;

        emit Deposited(user, amount, shares);
    }

    function withdraw(uint256 shareAmount) external nonReentrant whenNotPaused {
        require(shareAmount > 0, "Share amount must be > 0");
        require(userShares[msg.sender] >= shareAmount, "Insufficient shares");

        uint256 usdcAmount = (shareAmount * totalDeposited) / totalShares;

        userShares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;
        totalDeposited -= usdcAmount;

        depositToken.safeTransfer(msg.sender, usdcAmount);

        emit Withdrawn(msg.sender, usdcAmount, shareAmount);
    }

    function harvest(uint256 yieldAmount) external onlyKeeper whenNotPaused {
        uint256 fee = (yieldAmount * protocolFee) / 10000;
        uint256 netYield = yieldAmount - fee;

        totalDeposited += netYield;
        totalProtocolFeesAccrued += fee;
        totalYieldGenerated += yieldAmount;

        // V2: Send fees to WeaveRewards
        if (feeRecipient != address(0) && fee > 0) {
            depositToken.safeIncreaseAllowance(feeRecipient, fee);
            try IWeaveRewards(feeRecipient).distributeRewards(fee) {
                emit FeeSent(fee);
            } catch {
                // If call fails, keep fees in vault for future recovery
            }
        }

        emit Harvested(netYield, fee, block.timestamp);
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
        uint256 _totalProtocolFeesAccrued,
        uint256 _pricePerShare
    ) {
        return (
            totalDeposited,
            totalShares,
            totalYieldGenerated,
            totalProtocolFeesAccrued,
            getPricePerShare()
        );
    }
}
