// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IWeavifyStrategy
 * @dev Common interface for all Weavify strategies.
 */
interface IWeavifyStrategy {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function harvest() external returns (uint256);
    function balanceOf() external view returns (uint256);
    function getPendingYield() external view returns (uint256);
}
