// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract WeaveVault is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable depositToken;
    uint256 public totalDeposited;
    uint256 public totalShares;

    mapping(address => uint256) public userShares;
    mapping(address => uint256) public depositTimestamp;

    address public keeper;

    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount, uint256 shares);
    event Harvested(uint256 yieldAmount, uint256 timestamp);

    modifier onlyKeeper() {
        require(msg.sender == keeper || msg.sender == owner(), "Not keeper");
        _;
    }

    constructor(address _depositToken) Ownable(msg.sender) {
        depositToken = IERC20(_depositToken);
        keeper = msg.sender;
    }

    function deposit(uint256 amount) external {
        _depositFor(msg.sender, amount);
    }

    function depositFor(address user, uint256 amount) external {
        _depositFor(user, amount);
    }

    function _depositFor(address user, uint256 amount) internal nonReentrant whenNotPaused {
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

    function withdraw(uint256 shareAmount) external nonReentrant {
        require(shareAmount > 0, "Share amount must be > 0");
        require(userShares[msg.sender] >= shareAmount, "Insufficient shares");

        uint256 amount = (shareAmount * totalDeposited) / totalShares;

        userShares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;
        totalDeposited -= amount;

        depositToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount, shareAmount);
    }

    function harvest(uint256 yieldAmount) external onlyKeeper whenNotPaused {
        totalDeposited += yieldAmount;
        emit Harvested(yieldAmount, block.timestamp);
    }

    function getUserValue(address user) public view returns (uint256) {
        if (totalShares == 0) return 0;
        return (userShares[user] * totalDeposited) / totalShares;
    }

    function getPricePerShare() public view returns (uint256) {
        if (totalShares == 0) return 1e18;
        return (totalDeposited * 1e18) / totalShares;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    function setKeeper(address _keeper) external onlyOwner { keeper = _keeper; }
}
