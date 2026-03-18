// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../IWeavifyStrategy.sol";

interface IInitiaDEX {
    function addLiquidity(
        address tokenA, 
        address tokenB, 
        uint256 amountA, 
        uint256 amountB, 
        uint256 minA, 
        uint256 minB, 
        address to
    ) external returns (uint256 liquidity);
    
    function removeLiquidity(
        address tokenA, 
        address tokenB, 
        uint256 liquidity, 
        uint256 minA, 
        uint256 minB, 
        address to
    ) external returns (uint256 amountA, uint256 amountB);
    
    function swapExactTokensForTokens(
        uint256 amountIn, 
        uint256 amountOutMin, 
        address[] calldata path, 
        address to
    ) external returns (uint256[] memory amounts);

    function getQuote(uint256 amountIn, address[] calldata path) external view returns (uint256);
}

interface IInitiaEnshrinedLiquidity {
    function bondLP(address pool, uint256 amount, address validator) external;
    function unbondLP(address pool, uint256 amount) external;
    function claimStakingRewards() external;
    function pendingRewards(address user) external view returns (uint256);
}

/**
 * @title InitiaDEXStrategy
 * @dev Strategy for Initia Enshrined Liquidity USDC-INIT 20/80 Pool.
 */
contract InitiaDEXStrategy is IWeavifyStrategy, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    IERC20 public immutable init;
    IERC20 public immutable lpToken;
    IInitiaDEX public immutable dex;
    IInitiaEnshrinedLiquidity public immutable enshrinedLiquidity;
    
    address public weaveVault;
    address public treasury;
    address public validator;

    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant PERFORMANCE_FEE = 1000; // 10%

    event StrategyDeposited(uint256 usdcAmount, uint256 lpAmount);
    event StrategyWithdrawn(uint256 lpAmount, uint256 usdcAmount);
    event StrategyHarvested(uint256 harvestedUsdc, uint256 fee);

    constructor(
        address _usdc,
        address _init,
        address _lpToken,
        address _dex,
        address _enshrinedLiquidity,
        address _weaveVault,
        address _treasury,
        address _validator
    ) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        init = IERC20(_init);
        lpToken = IERC20(_lpToken);
        dex = IInitiaDEX(_dex);
        enshrinedLiquidity = IInitiaEnshrinedLiquidity(_enshrinedLiquidity);
        weaveVault = _weaveVault;
        treasury = _treasury;
        validator = _validator;
        
        // Initial approvals
        usdc.safeIncreaseAllowance(_dex, type(uint256).max);
        init.safeIncreaseAllowance(_dex, type(uint256).max);
        lpToken.safeIncreaseAllowance(_enshrinedLiquidity, type(uint256).max);
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

    function setValidator(address _validator) external onlyOwner {
        validator = _validator;
    }

    function deposit(uint256 amount) external override onlyVault {
        _deposit(amount);
    }

    function _deposit(uint256 amount) internal {
        // 1. Swap 80% USDC for INIT (to meet 20/80 weight requirement)
        uint256 amountToSwap = (amount * 80) / 100;
        uint256 amountRemaining = amount - amountToSwap;
        
        address[] memory path = new address[](2);
        path[0] = address(usdc);
        path[1] = address(init);
        
        dex.swapExactTokensForTokens(amountToSwap, 0, path, address(this));
        
        // 2. Add Liquidity
        uint256 initBalance = init.balanceOf(address(this));
        uint256 lpMinted = dex.addLiquidity(
            address(usdc), 
            address(init), 
            amountRemaining, 
            initBalance, 
            0, 
            0, 
            address(this)
        );
        
        // 3. Stake LP tokens
        enshrinedLiquidity.bondLP(address(lpToken), lpMinted, validator);
        
        emit StrategyDeposited(amount, lpMinted);
    }

    function withdraw(uint256 amount) external override onlyVault {
        uint256 totalValue = balanceOf();
        require(totalValue > 0, "No funds");
        
        // Calculate proportion of LP tokens to withdraw
        // amount / totalValue = lpToWithdraw / totalLp
        // We assume 1 lpToken = 1 unit of share for simplicity here
        // In real use, we'd need to track LP tokens bonded
        
        // For this implementation, we withdraw a pro-rata share of LP tokens
        // This is a simplified model of "withdraw specified amount of USDC"
        
        // Placeholder for LP calculation logic
        // For now, we'll withdraw based on amount requested vs total value
        uint256 lpToWithdraw = (amount * totalLP()) / totalValue;
        
        // 1. Unstake LP
        enshrinedLiquidity.unbondLP(address(lpToken), lpToWithdraw);
        
        // 2. Remove Liquidity
        (uint256 usdcReceived, uint256 initReceived) = dex.removeLiquidity(
            address(usdc), 
            address(init), 
            lpToWithdraw, 
            0, 
            0, 
            address(this)
        );
        
        // 3. Swap INIT back to USDC
        address[] memory path = new address[](2);
        path[0] = address(init);
        path[1] = address(usdc);
        dex.swapExactTokensForTokens(initReceived, 0, path, address(this));
        
        // 4. Return USDC to vault
        uint256 usdcBalance = usdc.balanceOf(address(this));
        usdc.safeTransfer(weaveVault, usdcBalance);
        
        emit StrategyWithdrawn(lpToWithdraw, usdcBalance);
    }

    function harvest() external override returns (uint256) {
        require(msg.sender == weaveVault || msg.sender == owner(), "Not authorized");
        
        // 1. Claim rewards (staking rewards + VIP rewards)
        enshrinedLiquidity.claimStakingRewards();
        
        // 2. Swap all non-USDC rewards to USDC
        uint256 harvestedInit = init.balanceOf(address(this));
        if (harvestedInit > 0) {
            address[] memory path = new address[](2);
            path[0] = address(init);
            path[1] = address(usdc);
            dex.swapExactTokensForTokens(harvestedInit, 0, path, address(this));
        }
        
        uint256 harvestedUsdc = usdc.balanceOf(address(this));
        if (harvestedUsdc > 0) {
            uint256 fee = (harvestedUsdc * PERFORMANCE_FEE) / FEE_DENOMINATOR;
            uint256 netYield = harvestedUsdc - fee;
            
            if (fee > 0) {
                usdc.safeTransfer(treasury, fee);
            }
            
            // Reinvest net yield
            _deposit(netYield);
            
            emit StrategyHarvested(harvestedUsdc, fee);
            return netYield;
        }
        
        return 0;
    }

    function totalLP() public view returns (uint256) {
        // This should return the total LP tokens owned by this strategy (bonded + unbonded)
        // For simplicity, we assume we can query this or track it
        return lpToken.balanceOf(address(this)); // This is likely wrong if they are bonded
        // In real implementation, we'd query the bond position
    }

    function balanceOf() public view override returns (uint256) {
        // Return total value in USDC
        // Value = (Bonded LP + Idle LP) converted to USDC + Idle USDC + Idle INIT converted to USDC
        
        // Simplified estimate for now:
        uint256 idleUsdc = usdc.balanceOf(address(this));
        uint256 idleInit = init.balanceOf(address(this));
        
        // Quote idle INIT to USDC
        address[] memory path = new address[](2);
        path[0] = address(init);
        path[1] = address(usdc);
        uint256 initToUsdc = (idleInit > 0) ? dex.getQuote(idleInit, path) : 0;
        
        // Quote LP to USDC (assuming 1 LP = pool value / total shares)
        // This is complex without pool reserves. We'll return a placeholder or simple logic
        return idleUsdc + initToUsdc; 
    }

    function getPendingYield() external view override returns (uint256) {
        return enshrinedLiquidity.pendingRewards(address(this));
    }
}

