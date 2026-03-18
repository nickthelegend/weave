// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../IWeavifyStrategy.sol";

interface IInitiaConcentratedDEX {
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

/**
 * @title StableLPStrategy
 * @dev Strategy for Initia Concentrated Stable Pool (iUSD-USDC).
 */
contract StableLPStrategy is IWeavifyStrategy, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    IERC20 public immutable iusd;
    IERC20 public immutable lpToken;
    IInitiaConcentratedDEX public immutable dex;
    
    address public weaveVault;
    address public treasury;

    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant PERFORMANCE_FEE = 1000; // 10%

    event StrategyDeposited(uint256 usdcAmount, uint256 lpAmount);
    event StrategyWithdrawn(uint256 lpAmount, uint256 usdcAmount);
    event StrategyHarvested(uint256 harvestedUsdc, uint256 fee);

    constructor(
        address _usdc,
        address _iusd,
        address _lpToken,
        address _dex,
        address _weaveVault,
        address _treasury
    ) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        iusd = IERC20(_iusd);
        lpToken = IERC20(_lpToken);
        dex = IInitiaConcentratedDEX(_dex);
        weaveVault = _weaveVault;
        treasury = _treasury;

        // Initial approvals
        usdc.safeIncreaseAllowance(_dex, type(uint256).max);
        iusd.safeIncreaseAllowance(_dex, type(uint256).max);
        lpToken.safeIncreaseAllowance(_dex, type(uint256).max);
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
        // 1. Swap 50% USDC for iUSD (target 50/50 for stable pool)
        uint256 half = amount / 2;
        uint256 remaining = amount - half;
        
        address[] memory path = new address[](2);
        path[0] = address(usdc);
        path[1] = address(iusd);
        
        dex.swapExactTokensForTokens(half, 0, path, address(this));
        
        // 2. Add Liquidity
        uint256 iusdBalance = iusd.balanceOf(address(this));
        uint256 lpMinted = dex.addLiquidity(
            address(usdc), 
            address(iusd), 
            remaining, 
            iusdBalance, 
            0, 
            0, 
            address(this)
        );
        
        emit StrategyDeposited(amount, lpMinted);
    }

    function withdraw(uint256 amount) external override onlyVault {
        uint256 totalValue = balanceOf();
        require(totalValue > 0, "No funds");
        
        uint256 lpToWithdraw = (amount * lpToken.balanceOf(address(this))) / totalValue;
        
        // 1. Remove Liquidity
        (uint256 usdcReceived, uint256 iusdReceived) = dex.removeLiquidity(
            address(usdc), 
            address(iusd), 
            lpToWithdraw, 
            0, 
            0, 
            address(this)
        );
        
        // 2. Swap iUSD back to USDC
        address[] memory path = new address[](2);
        path[0] = address(iusd);
        path[1] = address(usdc);
        dex.swapExactTokensForTokens(iusdReceived, 0, path, address(this));
        
        // 3. Return USDC to vault
        uint256 usdcBalance = usdc.balanceOf(address(this));
        usdc.safeTransfer(weaveVault, usdcBalance);
        
        emit StrategyWithdrawn(lpToWithdraw, usdcBalance);
    }

    function harvest() external override returns (uint256) {
        require(msg.sender == weaveVault || msg.sender == owner(), "Not authorized");
        
        // Concentrated pools typically compound fees into LP value automatically.
        // If there are external reward tokens or separate fee claiming, add here.
        
        uint256 idleUsdc = usdc.balanceOf(address(this));
        uint256 idleIusd = iusd.balanceOf(address(this));
        
        if (idleIusd > 0) {
            address[] memory path = new address[](2);
            path[0] = address(iusd);
            path[1] = address(usdc);
            dex.swapExactTokensForTokens(idleIusd, 0, path, address(this));
        }

        uint256 harvestedUsdc = usdc.balanceOf(address(this));

        if (harvestedUsdc > 0) {
            uint256 fee = (harvestedUsdc * PERFORMANCE_FEE) / FEE_DENOMINATOR;
            uint256 netYield = harvestedUsdc - fee;
            
            if (fee > 0) {
                usdc.safeTransfer(treasury, fee);
            }
            
            _deposit(netYield);
            
            emit StrategyHarvested(harvestedUsdc, fee);
            return netYield;
        }
        
        return 0;
    }

    function balanceOf() public view override returns (uint256) {
        uint256 idleUsdc = usdc.balanceOf(address(this));
        uint256 idleIusd = iusd.balanceOf(address(this));
        
        address[] memory path = new address[](2);
        path[0] = address(iusd);
        path[1] = address(usdc);
        uint256 iusdToUsdc = (idleIusd > 0) ? dex.getQuote(idleIusd, path) : 0;
        
        // Simplified: LP value estimate
        // In real use, we'd need to quote LP tokens to underlying assets
        return idleUsdc + iusdToUsdc; 
    }

    function getPendingYield() external view override returns (uint256) {
        return 0; 
    }
}

