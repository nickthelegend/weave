// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VIPScore
 * @dev Tracks Weavify user scores for Initia VIP program.
 * Synchronizes off-chain L1 VIP stage numbers with on-chain EVM scores.
 */
contract VIPScore is Ownable {
    
    struct StageData {
        uint64 stage;
        bool finalized;
        uint256 totalScore;
        mapping(address => uint256) scores;
    }

    mapping(uint64 => StageData) public stages;
    uint64[] public stageHistory;

    event ScoreUpdated(uint64 indexed stage, address indexed user, uint256 amount);
    event StageFinalized(uint64 indexed stage, uint256 totalScore);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Batch update scores for a specific VIP stage.
     * Called by the Weave Keeper bot after fetching L1 data.
     */
    function updateScores(
        uint64 stage, 
        address[] calldata addrs, 
        uint256[] calldata amounts
    ) external onlyOwner {
        require(!stages[stage].finalized, "Stage already finalized");
        require(addrs.length == amounts.length, "Mismatched arrays");

        if (stages[stage].stage == 0) {
            stages[stage].stage = stage;
            stageHistory.push(stage);
        }

        for (uint256 i = 0; i < addrs.length; i++) {
            stages[stage].totalScore = stages[stage].totalScore - stages[stage].scores[addrs[i]] + amounts[i];
            stages[stage].scores[addrs[i]] = amounts[i];
            emit ScoreUpdated(stage, addrs[i], amounts[i]);
        }
    }

    /**
     * @dev Marks a stage as finalized.
     */
    function finalizeStage(uint64 stage) external onlyOwner {
        require(stages[stage].stage != 0, "Stage not found");
        stages[stage].finalized = true;
        emit StageFinalized(stage, stages[stage].totalScore);
    }

    function getScore(uint64 stage, address user) external view returns (uint256) {
        return stages[stage].scores[user];
    }

    function getStageTotal(uint64 stage) external view returns (uint256) {
        return stages[stage].totalScore;
    }

    function isFinalized(uint64 stage) external view returns (bool) {
        return stages[stage].finalized;
    }

    function getStageHistory() external view returns (uint64[] memory) {
        return stageHistory;
    }
}
