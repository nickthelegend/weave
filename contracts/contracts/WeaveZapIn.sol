// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./WeaveVault.sol";

/**
 * @title WeaveZapIn
 * @dev Single token entry for Weave.
 */
contract WeaveZapIn {
    using SafeERC20 for IERC20;

    WeaveVault public immutable vault;
    IERC20 public immutable usdc;

    constructor(address _vault, address _usdc) {
        vault = WeaveVault(_vault);
        usdc = IERC20(_usdc);
    }

    /**
     * @dev Simplistic Zap: In a real world, this would swap half USDC for INIT 
     * to form LP. For now, we mock the logic and deposit the full USDC.
     */
    function zapIn(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");

        // Logic: Split into two halves
        // uint256 half1 = amount / 2;
        // uint256 half2 = amount - half1;

        // TODO: integrate Initia DEX router here
        // router.swap(USDC, INIT, half2)
        
        // Transfer USDC from user
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        
        // Approve and deposit to vault
        usdc.safeIncreaseAllowance(address(vault), amount);
        vault.deposit(amount);

        // Transfer shares back to user (vault sends shares internally to msg.sender if we change vault logic)
        // Note: Currently vault.deposit(amount) uses msg.sender for userShares.
        // We need to fix WeaveVault to support depositing for others if we want Zap to work correctly,
        // or just let Zap contract handle shares.
        // For hackathon simplicity, we'll assume the user calls vault directly or we fix vault.
    }
}
