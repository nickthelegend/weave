// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../IWeavifyStrategy.sol";

/**
 * @title StableLPStrategy
 * @dev Re-architected for Move-based Concentrated DEX interaction via off-chain Keeper.
 */
contract StableLPStrategy is IWeavifyStrategy, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public weaveVault;
    address public treasury;
    address public keeper;

    uint256 public trackedBalance; // USDC value in the concentrated LP position
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

    function deposit(uint256 amount) external override onlyVault {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        pendingDeposits += amount;
        emit StrategyDeposited(amount);
    }

    function withdraw(uint256 amount) external override onlyVault {
        if (usdc.balanceOf(address(this)) >= amount) {
            usdc.safeTransfer(weaveVault, amount);
            if (pendingDeposits >= amount) {
                pendingDeposits -= amount;
            }
        } else {
            revert("Insufficient liquid funds in strategy - wait for liquidation");
        }
        emit StrategyWithdrawn(amount);
    }

    function updateBalance(uint256 newTotalValue) external onlyKeeper {
        trackedBalance = newTotalValue;
        pendingDeposits = 0;
        emit BalanceUpdated(newTotalValue, block.timestamp);
    }

    function harvest() external override returns (uint256) {
        // Harvest happens off-chain in Move Concentrated DEX. 
        return 0; 
    }

    function balanceOf() public view override returns (uint256) {
        return trackedBalance + usdc.balanceOf(address(this));
    }

    function getPendingYield() external view override returns (uint256) {
        return 0;
    }
}


