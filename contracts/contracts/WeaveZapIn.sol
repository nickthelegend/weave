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
    function deposit(uint256 usdcAmount, address vaultAddress) external {
        require(usdcAmount > 0, "Amount must be > 0");

        IWeaveVault vault = IWeaveVault(vaultAddress);
        IERC20 usdc = IERC20(vault.depositToken());
        
        // Transfer USDC from user to this contract
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        
        // Approve vault and deposit for user
        usdc.safeIncreaseAllowance(vaultAddress, usdcAmount);
        vault.depositFor(msg.sender, usdcAmount);

        emit ZapDeposited(msg.sender, usdcAmount);
    }
}
