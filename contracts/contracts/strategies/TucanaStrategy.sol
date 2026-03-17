// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// TODO: Replace with real Tucana interface
interface ITucana {
    function addLiquidity(uint256 amount) external;
    function removeLiquidity(uint256 amount) external;
    function claimFundingFees() external returns (uint256);
    function pendingFees(address provider) view returns (uint256);
}

/**
 * @title TucanaStrategy
 * @dev V3 Strategy for Tucana Perps.
 */
contract TucanaStrategy is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable depositToken;
    ITucana public immutable tucanaVault;
    address public weaveVault;

    event StrategyDeposited(uint256 amount);
    event StrategyWithdrawn(uint256 amount);
    event StrategyHarvested(uint256 amount);

    constructor(address _depositToken, address _tucanaVault, address _weaveVault) Ownable(msg.sender) {
        depositToken = IERC20(_depositToken);
        tucanaVault = ITucana(_tucanaVault);
        weaveVault = _weaveVault;
    }

    function deposit(uint256 amount) external {
        require(msg.sender == weaveVault, "Not vault");
        depositToken.safeIncreaseAllowance(address(tucanaVault), amount);
        tucanaVault.addLiquidity(amount);
        emit StrategyDeposited(amount);
    }

    function withdraw(uint256 amount) external {
        require(msg.sender == weaveVault, "Not vault");
        tucanaVault.removeLiquidity(amount);
        depositToken.safeTransfer(weaveVault, amount);
        emit StrategyWithdrawn(amount);
    }

    function harvest() external returns (uint256) {
        require(msg.sender == weaveVault, "Not vault");
        uint256 harvested = tucanaVault.claimFundingFees();
        
        if (harvested > 0) {
            depositToken.safeTransfer(weaveVault, harvested);
        }
        
        emit StrategyHarvested(harvested);
        return harvested;
    }

    function getPendingYield() external view returns (uint256) {
        return tucanaVault.pendingFees(address(this));
    }
}
