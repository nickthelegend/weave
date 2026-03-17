import { expect } from "chai";
import pkg from 'hardhat';
const { ethers } = pkg;

describe("Weave V3 Cross-Minitia", function () {
  let router: any;
  let vault: any;
  let usdc: any;
  let strategy1: any;
  let strategy2: any;
  let owner: any;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20.deploy("Mock USDC", "USDC", 6);

    const WeaveVault = await ethers.getContractFactory("WeaveVault");
    vault = await WeaveVault.deploy(await usdc.getAddress());

    const Router = await ethers.getContractFactory("CrossMinitiaRouter");
    router = await Router.deploy(await vault.getAddress(), await usdc.getAddress());

    // Deploy mock strategies
    const MockStrategy = await ethers.getContractFactory("BlackwingStrategy");
    strategy1 = await MockStrategy.deploy(await usdc.getAddress(), owner.address, await router.getAddress());
    strategy2 = await MockStrategy.deploy(await usdc.getAddress(), owner.address, await router.getAddress());

    await router.addMinitiaVault("Blackwing", await strategy1.getAddress(), 2001, 6000); // 60%
    await router.addMinitiaVault("Tucana", await strategy2.getAddress(), 2002, 4000);    // 40%
  });

  it("Test 1: Route capital splits correctly", async function () {
    const amount = ethers.parseUnits("1000", 6);
    await usdc.mint(owner.address, amount);
    await usdc.approve(await vault.getAddress(), amount);
    await vault.deposit(amount);
    
    // Transfer to router and route
    await usdc.mint(await vault.getAddress(), amount); // Simulating funds in vault
    await vault.setFeeRecipient(await router.getAddress()); // Router acts as recipient for test
    
    // We'll call router directly for the unit test logic
    await usdc.mint(await router.getAddress(), amount);
    await router.routeCapital(amount);

    const v1 = await router.minitiaVaults(0);
    const v2 = await router.minitiaVaults(1);
    expect(v1.totalDeposited).to.equal(ethers.parseUnits("600", 6));
    expect(v2.totalDeposited).to.equal(ethers.parseUnits("400", 6));
  });

  it("Test 3: Rebalance updates allocations correctly", async function () {
    await router.rebalance([3000, 7000]);
    const v1 = await router.minitiaVaults(0);
    const v2 = await router.minitiaVaults(1);
    expect(v1.allocation).to.equal(3000);
    expect(v2.allocation).to.equal(7000);
  });
});
