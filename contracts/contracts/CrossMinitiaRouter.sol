// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IStrategy {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function harvest() external returns (uint256);
}

/**
 * @title CrossMinitiaRouter
 * @dev Routes capital between Minitia strategies.
 */
contract CrossMinitiaRouter is Ownable {
    using SafeERC20 for IERC20;

    struct MinitiaVault {
        string name;
        address strategy;
        uint256 chainId;
        uint256 allocation; // % in basis points (10000 = 100%)
        uint256 totalDeposited;
        bool active;
    }

    MinitiaVault[] public minitiaVaults;
    address public immutable mainVault;
    IERC20 public immutable depositToken;

    event MinitiaVaultAdded(string name, address strategy, uint256 chainId, uint256 initialAllocation);
    event Rebalanced(uint256[] newAllocations);
    event CapitalRouted(uint256 totalAmount);
    event AllHarvested(uint256 totalYield);

    constructor(address _mainVault, address _depositToken) Ownable(msg.sender) {
        mainVault = _mainVault;
        depositToken = IERC20(_depositToken);
    }

    function addMinitiaVault(
        string memory name,
        address strategy,
        uint256 chainId,
        uint256 initialAllocation
    ) external onlyOwner {
        minitiaVaults.push(MinitiaVault({
            name: name,
            strategy: strategy,
            chainId: chainId,
            allocation: initialAllocation,
            totalDeposited: 0,
            active: true
        }));
        emit MinitiaVaultAdded(name, strategy, chainId, initialAllocation);
    }

    function routeCapital(uint256 totalAmount) external {
        require(msg.sender == mainVault, "Not vault");
        
        depositToken.safeTransferFrom(mainVault, address(this), totalAmount);

        for (uint256 i = 0; i < minitiaVaults.length; i++) {
            if (minitiaVaults[i].active && minitiaVaults[i].allocation > 0) {
                uint256 amountToRoute = (totalAmount * minitiaVaults[i].allocation) / 10000;
                if (amountToRoute > 0) {
                    depositToken.safeIncreaseAllowance(minitiaVaults[i].strategy, amountToRoute);
                    IStrategy(minitiaVaults[i].strategy).deposit(amountToRoute);
                    minitiaVaults[i].totalDeposited += amountToRoute;
                }
            }
        }
        emit CapitalRouted(totalAmount);
    }

    function harvestAll() external returns (uint256) {
        require(msg.sender == mainVault, "Not vault");
        uint256 totalYield = 0;
        for (uint256 i = 0; i < minitiaVaults.length; i++) {
            if (minitiaVaults[i].active) {
                totalYield += IStrategy(minitiaVaults[i].strategy).harvest();
            }
        }
        
        if (totalYield > 0) {
            depositToken.safeTransfer(mainVault, totalYield);
        }
        
        emit AllHarvested(totalYield);
        return totalYield;
    }

    function rebalance(uint256[] calldata newAllocations) external {
        // TODO: restrict to governance only (veWEAVE gauge results)
        require(newAllocations.length == minitiaVaults.length, "Length mismatch");
        
        uint256 totalAlloc = 0;
        for (uint256 i = 0; i < newAllocations.length; i++) {
            minitiaVaults[i].allocation = newAllocations[i];
            totalAlloc += newAllocations[i];
        }
        require(totalAlloc <= 10000, "Invalid total allocation");

        emit Rebalanced(newAllocations);
    }

    function getTotalCrossMinitiaValue() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < minitiaVaults.length; i++) {
            total += minitiaVaults[i].totalDeposited;
        }
        return total;
    }
}
