// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// TODO: Replace with real Blackwing interface 
// once ABI is published at docs.blackwing.xyz
interface IBlackwing {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function pendingRewards(address user) view returns (uint256);
    function claimRewards() external;
}

/**
 * @title BlackwingStrategy
 * @dev V3 Strategy for Blackwing Margin Protocol on Initia.
 */
contract BlackwingStrategy is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable depositToken;
    IBlackwing public immutable blackwingVault;
    address public weaveVault;

    event StrategyDeposited(uint256 amount);
    event StrategyWithdrawn(uint256 amount);
    event StrategyHarvested(uint256 amount);

    constructor(address _depositToken, address _blackwingVault, address _weaveVault) Ownable(msg.sender) {
        depositToken = IERC20(_depositToken);
        blackwingVault = IBlackwing(_blackwingVault);
        weaveVault = _weaveVault;
    }

    function deposit(uint256 amount) external {
        require(msg.sender == weaveVault, "Not vault");
        depositToken.safeIncreaseAllowance(address(blackwingVault), amount);
        blackwingVault.deposit(amount);
        emit StrategyDeposited(amount);
    }

    function withdraw(uint256 amount) external {
        require(msg.sender == weaveVault, "Not vault");
        blackwingVault.withdraw(amount);
        depositToken.safeTransfer(weaveVault, amount);
        emit StrategyWithdrawn(amount);
    }

    function harvest() external returns (uint256) {
        require(msg.sender == weaveVault, "Not vault");
        uint256 before = depositToken.balanceOf(address(this));
        blackwingVault.claimRewards();
        uint256 afterBal = depositToken.balanceOf(address(this));
        uint256 harvested = afterBal - before;
        
        if (harvested > 0) {
            depositToken.safeTransfer(weaveVault, harvested);
        }
        
        emit StrategyHarvested(harvested);
        return harvested;
    }

    function getPendingYield() external view returns (uint256) {
        return blackwingVault.pendingRewards(address(this));
    }
}
