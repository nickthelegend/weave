// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WeaveToken
 * @dev Standard ERC20 governance token for Weave Protocol.
 */
contract WeaveToken is ERC20, Ownable {
    bool public initialMintDone;

    event Burn(address indexed from, uint256 amount);

    constructor(
        address rewardsVault,
        address teamVesting,
        address treasury,
        address airdrop,
        address partners
    ) ERC20("Weave Token", "WEAVE") Ownable(msg.sender) {
        _mint(rewardsVault, 40_000_000 * 10**18);
        _mint(teamVesting, 20_000_000 * 10**18);
        _mint(treasury, 20_000_000 * 10**18);
        _mint(airdrop, 10_000_000 * 10**18);
        _mint(partners, 10_000_000 * 10**18);
        initialMintDone = true;
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit Burn(msg.sender, amount);
    }
}
