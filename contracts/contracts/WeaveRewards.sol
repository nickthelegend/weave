// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVeWeave {
    function getVotingPower(address user) external view returns (uint256);
    function totalVeSupply() external view returns (uint256);
}

/**
 * @title WeaveRewards
 * @dev Distributes protocol fees (USDC) to veWEAVE holders.
 */
contract WeaveRewards is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    IVeWeave public immutable veWeave;

    uint256 public rewardsPerVeWeave; // Cumulative rewards per unit of veWEAVE
    mapping(address => uint256) public rewardMask; // Tracks last "checkpoint" for user
    mapping(address => uint256) public totalClaimed;
    uint256 public totalDistributed;

    event RewardsDistributed(uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);

    constructor(address _usdc, address _veWeave) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        veWeave = IVeWeave(_veWeave);
    }

    /**
     * @dev Called by the vault or treasury to distribute protocol fees.
     */
    function distributeRewards(uint256 usdcAmount) external onlyOwner {
        uint256 supply = veWeave.totalVeSupply();
        require(supply > 0, "No veWEAVE holders");

        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        
        // Scale by 1e18 to prevent rounding issues
        rewardsPerVeWeave += (usdcAmount * 1e18) / supply;
        totalDistributed += usdcAmount;

        emit RewardsDistributed(usdcAmount);
    }

    function claimRewards() external nonReentrant {
        uint256 owed = pendingRewards(msg.sender);
        require(owed > 0, "No rewards to claim");

        rewardMask[msg.sender] = (veWeave.getVotingPower(msg.sender) * rewardsPerVeWeave) / 1e18;
        totalClaimed[msg.sender] += owed;

        usdc.safeTransfer(msg.sender, owed);

        emit RewardsClaimed(msg.sender, owed);
    }

    function pendingRewards(address user) public view returns (uint256) {
        uint256 power = veWeave.getVotingPower(user);
        uint256 totalOwed = (power * rewardsPerVeWeave) / 1e18;
        
        // If user hasn't claimed before, mask is 0
        if (totalOwed <= rewardMask[user]) return 0;
        return totalOwed - rewardMask[user];
    }
}
