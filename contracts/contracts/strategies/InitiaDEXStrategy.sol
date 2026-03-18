// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../IWeavifyStrategy.sol";

/**
 * @title InitiaDEXStrategy
 * @dev Re-architected for Move-based DEX interaction via off-chain Keeper.
 */
contract InitiaDEXStrategy is IWeavifyStrategy, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public weaveVault;
    address public treasury;
    address public keeper;

    uint256 public trackedBalance; // Real USDC value in the LP position (updated by keeper)
    uint256 public pendingDeposits; // Idle USDC waiting for keeper zap
    
    event StrategyDeposited(uint256 amount);
    event StrategyWithdrawn(uint256 amount);
    event BalanceUpdated(uint256 newBalance, uint256 timestamp);

    constructor(
        address _usdc,
        address _weaveVault,
        address _treasury,
        address _keeper
    ) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        weaveVault = _weaveVault;
        treasury = _treasury;
        keeper = _keeper;
    }

    modifier onlyVault() {
        require(msg.sender == weaveVault, "Not vault");
        _;
    }

    modifier onlyKeeper() {
        require(msg.sender == keeper || msg.sender == owner(), "Not keeper");
        _;
    }

    function setKeeper(address _keeper) external onlyOwner {
        keeper = _keeper;
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    /**
     * @dev Recieved USDC from vault. It will be zapped by keeper off-chain.
     */
    function deposit(uint256 amount) external override onlyVault {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        pendingDeposits += amount;
        emit StrategyDeposited(amount);
    }

    /**
     * @dev Synchronous withdraw from idle funds if possible, 
     * otherwise signals keeper to liquidate LP tokens.
     * Note: In automated yield aggregator architecture, withdraws usually 
     * expect immediate return of funds.
     */
    function withdraw(uint256 amount) external override onlyVault {
        if (usdc.balanceOf(address(this)) >= amount) {
            usdc.safeTransfer(weaveVault, amount);
            if (pendingDeposits >= amount) {
                pendingDeposits -= amount;
            }
        } else {
            // In real cases, this might require a partial liquidation by keeper.
            // For now, we assume strategy has enough liquid USDC for immediate withdraws
            // or the vault handles the liquidity gap.
            revert("Insufficient liquid funds in strategy - wait for harvest");
        }
        emit StrategyWithdrawn(amount);
    }

    /**
     * @dev Called by Keeper Bot after successful harvest/zap to update TVL.
     */
    function updateBalance(uint256 newTotalValue) external onlyKeeper {
        // Track the yield generated since last update
        if (newTotalValue > trackedBalance) {
            uint256 yield = newTotalValue - trackedBalance;
            totalYieldGenerated += yield; // If we keep a counter
        }
        
        trackedBalance = newTotalValue;
        pendingDeposits = 0; // Reset as keeper has moved funds to LP
        emit BalanceUpdated(newTotalValue, block.timestamp);
    }

    uint256 public totalYieldGenerated;

    function harvest() external override returns (uint256) {
        // Harvest now happens off-chain in Move DEX. 
        // This Solidity function returns 0 or the last known yield.
        return 0; 
    }

    function balanceOf() public view override returns (uint256) {
        return trackedBalance + usdc.balanceOf(address(this));
    }

    function getPendingYield() external view override returns (uint256) {
        // In real use, keeper would update this variable too
        return 0;
    }
}


