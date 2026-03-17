// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WeaveVesting
 * @dev Team token vesting: 2yr cliff + 2yr vest (4 years total).
 */
contract WeaveVesting is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable weaveToken;
    address public immutable beneficiary;
    
    uint256 public immutable vestStart;
    uint256 public immutable cliff;
    uint256 public immutable vestEnd;
    
    uint256 public totalAmount;
    uint256 public claimed;

    event Claimed(uint256 amount, uint256 timestamp);

    constructor(address _weaveToken, address _beneficiary, uint256 _totalAmount) Ownable(msg.sender) {
        weaveToken = IERC20(_weaveToken);
        beneficiary = _beneficiary;
        totalAmount = _totalAmount;
        
        vestStart = block.timestamp;
        cliff = block.timestamp + 730 days; // 2 years
        vestEnd = block.timestamp + 1460 days; // 4 years
    }

    function claim() external {
        require(block.timestamp >= cliff, "Vesting: cliff not reached");
        uint256 vestable = vestedAmount();
        uint256 amountToClaim = vestable - claimed;
        require(amountToClaim > 0, "Vesting: nothing to claim");

        claimed += amountToClaim;
        weaveToken.safeTransfer(beneficiary, amountToClaim);

        emit Claimed(amountToClaim, block.timestamp);
    }

    function vestedAmount() public view returns (uint256) {
        if (block.timestamp < cliff) {
            return 0;
        } else if (block.timestamp >= vestEnd) {
            return totalAmount;
        } else {
            return (totalAmount * (block.timestamp - vestStart)) / (vestEnd - vestStart);
        }
    }
}
