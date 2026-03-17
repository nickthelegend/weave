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
        uint256 allocation; // % of capital (basis points, 10000 = 100%)
    }

    IVeWeave public immutable veWeave;
    Gauge[] public gauges;
    
    uint256 public epochEnd;
    uint256 public constant EPOCH_DURATION = 7 days;

    mapping(address => mapping(uint256 => uint256)) public userVotes; // user -> gaugeId -> votes

    event GaugeAdded(string name, address strategy);
    event Voted(address indexed user, uint256 gaugeId, uint256 amount);
    event EpochFinalized(uint256[] allocations);

    constructor(address _veWeave) Ownable(msg.sender) {
        veWeave = IVeWeave(_veWeave);
        epochEnd = block.timestamp + EPOCH_DURATION;
    }

    function addGauge(string memory name, address strategy) external onlyOwner {
        gauges.push(Gauge({
            name: name,
            strategy: strategy,
            totalVotes: 0,
            allocation: 0
        }));
        emit GaugeAdded(name, strategy);
    }

    function vote(uint256 gaugeId, uint256 veAmount) external {
        require(gaugeId < gauges.length, "Invalid gauge");
        uint256 power = veWeave.getVotingPower(msg.sender);
        require(power >= veAmount, "Insufficient voting power");

        // Subtract previous vote from user and gauge
        gauges[gaugeId].totalVotes -= userVotes[msg.sender][gaugeId];
        
        userVotes[msg.sender][gaugeId] = veAmount;
        gauges[gaugeId].totalVotes += veAmount;

        emit Voted(msg.sender, gaugeId, veAmount);
    }

    function finalizeEpoch() external {
        require(block.timestamp >= epochEnd, "Epoch not ended");
        
        uint256 totalVotes = 0;
        for (uint256 i = 0; i < gauges.length; i++) {
            totalVotes += gauges[i].totalVotes;
        }

        uint256[] memory newAllocations = new uint256[](gauges.length);
        if (totalVotes > 0) {
            for (uint256 i = 0; i < gauges.length; i++) {
                uint256 alloc = (gauges[i].totalVotes * 10000) / totalVotes;
                gauges[i].allocation = alloc;
                newAllocations[i] = alloc;
                // Reset votes for next epoch
                gauges[i].totalVotes = 0;
            }
        }

        epochEnd = block.timestamp + EPOCH_DURATION;
        emit EpochFinalized(newAllocations);
    }

    function getGaugeCount() external view returns (uint256) {
        return gauges.length;
    }

    function getGauge(uint256 id) external view returns (Gauge memory) {
        return gauges[id];
    }
}
