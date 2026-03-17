// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VeWeave
 * @dev Vote-escrowed WEAVE. Non-transferable governance token earned by locking WEAVE.
 */
contract VeWeave is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct LockPosition {
        uint256 amount;     // WEAVE locked
        uint256 lockEnd;    // timestamp when lock expires
        uint256 veBalance;  // veWEAVE voting power
    }

    IERC20 public immutable weaveToken;
    uint256 public totalVeSupply;
    mapping(address => LockPosition) public locks;

    // Multipliers scaled by 100 for precision (0.25x = 25, 4x = 400)
    uint256[5] public durations = [90 days, 180 days, 365 days, 730 days, 1460 days];
    uint256[5] public multipliers = [25, 50, 100, 200, 400];

    event Locked(address indexed user, uint256 amount, uint256 duration, uint256 veBalance);
    event Unlocked(address indexed user, uint256 amount);
    event LockExtended(address indexed user, uint256 newDuration);

    constructor(address _weaveToken) {
        weaveToken = IERC20(_weaveToken);
    }

    function lock(uint256 amount, uint256 durationIndex) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(durationIndex < 5, "Invalid duration index");
        require(locks[msg.sender].amount == 0, "Lock already exists");

        uint256 duration = durations[durationIndex];
        uint256 multiplier = multipliers[durationIndex];
        uint256 veBalance = (amount * multiplier) / 100;

        weaveToken.safeTransferFrom(msg.sender, address(this), amount);

        locks[msg.sender] = LockPosition({
            amount: amount,
            lockEnd: block.timestamp + duration,
            veBalance: veBalance
        });

        totalVeSupply += veBalance;

        emit Locked(msg.sender, amount, duration, veBalance);
    }

    function unlock() external nonReentrant {
        LockPosition storage userLock = locks[msg.sender];
        require(userLock.amount > 0, "No lock found");
        require(block.timestamp >= userLock.lockEnd, "Lock not expired");

        uint256 amount = userLock.amount;
        uint256 veBalance = userLock.veBalance;

        totalVeSupply -= veBalance;
        delete locks[msg.sender];

        weaveToken.safeTransfer(msg.sender, amount);

        emit Unlocked(msg.sender, amount);
    }

    function getVotingPower(address user) public view returns (uint256) {
        if (block.timestamp >= locks[user].lockEnd) {
            return 0;
        }
        return locks[user].veBalance;
    }

    function getTotalVotingPower() external view returns (uint256) {
        return totalVeSupply;
    }

    function getUserLock(address user) external view returns (LockPosition memory) {
        return locks[user];
    }

    // veWEAVE is non-transferable
    function transfer(address, uint256) external pure returns (bool) {
        revert("veWEAVE: non-transferable");
    }

    function transferFrom(address, address, uint256) external pure returns (bool) {
        revert("veWEAVE: non-transferable");
    }
}
