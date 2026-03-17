// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockProtocol is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function deposit(uint256 amount) external {}
    function withdraw(uint256 amount) external {}
    function pendingRewards(address) external view returns (uint256) { return 0; }
    function claimRewards() external {}

    function addLiquidity(uint256 amount) external {}
    function removeLiquidity(uint256 amount) external {}
    function claimFundingFees() external returns (uint256) { return 0; }
    function pendingFees(address) external view returns (uint256) { return 0; }
}
