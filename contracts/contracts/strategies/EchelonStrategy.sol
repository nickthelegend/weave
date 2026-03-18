// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../IWeavifyStrategy.sol";

interface IEchelonMarket {
    function supply(uint256 amount) external;
    function redeem(uint256 amount) external;
    function balanceOf(address user) external view returns (uint256);
    function claimRewards() external;
    function pendingRewards(address user) external view returns (uint256);
}

/**
 * @title EchelonStrategy
 * @dev Strategy for Echelon Finance lending markets on Initia.
 */
contract EchelonStrategy is IWeavifyStrategy, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable depositToken;
    IEchelonMarket public immutable market;
    address public weaveVault;
    address public treasury;

    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant PERFORMANCE_FEE = 1000; // 10%

    event StrategyDeposited(uint256 amount);
    event StrategyWithdrawn(uint256 amount);
    event StrategyHarvested(uint256 netYield, uint256 fee);

    constructor(
        address _depositToken,
        address _market,
        address _weaveVault,
        address _treasury
    ) Ownable(msg.sender) {
        depositToken = IERC20(_depositToken);
        market = IEchelonMarket(_market);
        weaveVault = _weaveVault;
        treasury = _treasury;
        
        // Initial approval
        depositToken.safeIncreaseAllowance(_market, type(uint256).max);
    }

    modifier onlyVault() {
        require(msg.sender == weaveVault, "Not vault");
        _;
    }

    function setWeaveVault(address _weaveVault) external onlyOwner {
        weaveVault = _weaveVault;
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function deposit(uint256 amount) external override onlyVault {
        _deposit(amount);
    }

    function _deposit(uint256 amount) internal {
        market.supply(amount);
        emit StrategyDeposited(amount);
    }

    function withdraw(uint256 amount) external override onlyVault {
        market.redeem(amount);
        depositToken.safeTransfer(weaveVault, amount);
        emit StrategyWithdrawn(amount);
    }

    function harvest() external override returns (uint256) {
        require(msg.sender == weaveVault || msg.sender == owner(), "Not authorized");
        
        uint256 before = depositToken.balanceOf(address(this));
        market.claimRewards();
        uint256 yield = depositToken.balanceOf(address(this)) - before;
        
        if (yield > 0) {
            uint256 fee = (yield * PERFORMANCE_FEE) / FEE_DENOMINATOR;
            uint256 netYield = yield - fee;
            
            if (fee > 0) {
                depositToken.safeTransfer(treasury, fee);
            }
            
            // Reinvest net yield
            _deposit(netYield);
            
            emit StrategyHarvested(netYield, fee);
            return netYield;
        }
        
        return 0;
    }

    function balanceOf() public view override returns (uint256) {
        return market.balanceOf(address(this)) + depositToken.balanceOf(address(this));
    }

    function getPendingYield() external view override returns (uint256) {
        return market.pendingRewards(address(this)); 
    }
}

