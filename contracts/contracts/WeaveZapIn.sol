// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IWeaveVault {
    function depositFor(address user, uint256 amount) external;
    function depositToken() external view returns (address);
}

/**
 * @title WeaveZapIn
 * @dev Single token entry for Weave.
 */
contract WeaveZapIn {
    using SafeERC20 for IERC20;

    event ZapDeposited(address indexed user, uint256 amount);

    /**
     * @dev Simplistic Zap: For now, we deposit the full USDC.
     * Roadmap v2: Split 50/50 and swap half to INIT via Initia DEX.
     */
    function zapIn(address tokenIn, uint256 amountIn, address vaultAddress) external {
        require(amountIn > 0, "Amount must be > 0");

        IWeaveVault vault = IWeaveVault(vaultAddress);
        address usdc = vault.depositToken();
        
        require(tokenIn == usdc, "Only USDC deposits supported in V1. INIT zap coming in V2.");
        
        // Transfer USDC from user to this contract
        IERC20(usdc).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Approve vault and deposit for user
        IERC20(usdc).safeIncreaseAllowance(vaultAddress, amountIn);
        vault.depositFor(msg.sender, amountIn);

        emit ZapDeposited(msg.sender, amountIn);
    }
}
