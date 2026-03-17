// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IVeWeave {
    function getVotingPower(address user) external view returns (uint256);
}

/**
 * @title WeaveGauge
 * @dev Governance mechanism for voting on capital allocation between strategies.
 */
contract WeaveGauge is Ownable {
    struct Gauge {
        string name;
        address strategy;
        uint256 totalVotes;
    }

    IVeWeave public immutable veWeave;
    Gauge[] public gauges;
    
    uint256 public epochEnd;
    uint256 public constant EPOCH_DURATION = 7 days;

    mapping(address => mapping(uint256 => uint256)) public userVotes; // user -> gaugeId -> votes
    mapping(address => uint256) public userTotalVotes; // Total votes cast by user in current epoch

    event GaugeAdded(string name, address strategy);
    event Voted(address indexed user, uint256 gaugeId, uint256 amount);

    constructor(address _veWeave) Ownable(msg.sender) {
        veWeave = IVeWeave(_veWeave);
        epochEnd = block.timestamp + EPOCH_DURATION;
    }

    function addGauge(string memory name, address strategy) external onlyOwner {
        gauges.push(Gauge({
            name: name,
            strategy: strategy,
            totalVotes: 0
        }));
        emit GaugeAdded(name, strategy);
    }

    function vote(uint256 gaugeId, uint256 weightBasisPoints) external {
        require(gaugeId < gauges.length, "Invalid gauge");
        require(weightBasisPoints <= 10000, "Max 100%");
        
        // Reset epoch if needed
        if (block.timestamp > epochEnd) {
            epochEnd = block.timestamp + EPOCH_DURATION;
            // Note: In a production gauge, we would handle vote resets or snapshots here.
        }

        uint256 power = veWeave.getVotingPower(msg.sender);
        require(power > 0, "No voting power");

        uint256 votesToCast = (power * weightBasisPoints) / 10000;
        
        // Basic voting logic: overwrite previous vote for simplicity in hackathon
        gauges[gaugeId].totalVotes -= userVotes[msg.sender][gaugeId];
        userVotes[msg.sender][gaugeId] = votesToCast;
        gauges[gaugeId].totalVotes += votesToCast;

        emit Voted(msg.sender, gaugeId, votesToCast);
    }

    function getGaugeCount() external view returns (uint256) {
        return gauges.length;
    }

    function getGauge(uint256 id) external view returns (Gauge memory) {
        return gauges[id];
    }
}
