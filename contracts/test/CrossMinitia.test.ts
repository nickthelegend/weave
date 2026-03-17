import { expect } from "chai";
import pkg from 'hardhat';
const { ethers } = pkg;

describe("Weave V3 Cross-Minitia", function () {
  let router: any;
  let vault: any;
  let usdc: any;
  let strategy1: any;
  let strategy2: any;
  let mockBlackwing: any;
  let mockTucana: any;
  let owner: any;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20.deploy("Mock USDC", "USDC", 6);

    const WeaveVault = await ethers.getContractFactory("WeaveVault");
    vault = await WeaveVault.deploy(await usdc.getAddress());

    const Router = await ethers.getContractFactory("CrossMinitiaRouter");
    router = await Router.deploy(await vault.getAddress(), await usdc.getAddress());

    // Deploy mock protocols
    const MockProtocol = await ethers.getContractFactory("MockProtocol");
    mockBlackwing = await MockProtocol.deploy("Blackwing", "BW");
    mockTucana = await MockProtocol.deploy("Tucana", "TC");

    // Deploy mock strategies
    const BlackwingStrategy = await ethers.getContractFactory("BlackwingStrategy");
    strategy1 = await BlackwingStrategy.deploy(await usdc.getAddress(), await mockBlackwing.getAddress(), await router.getAddress());
    
    const TucanaStrategy = await ethers.getContractFactory("TucanaStrategy");
    strategy2 = await TucanaStrategy.deploy(await usdc.getAddress(), await mockTucana.getAddress(), await router.getAddress());

    await router.addMinitiaVault("Blackwing", await strategy1.getAddress(), 2001, 6000); // 60%
    await router.addMinitiaVault("Tucana", await strategy2.getAddress(), 2002, 4000);    // 40%
  });

  it("Test 1: Route capital splits correctly", async function () {
    const amount = ethers.parseUnits("1000", 6);
    
    const TestRouter = await ethers.getContractFactory("CrossMinitiaRouter");
    const testRouter = await TestRouter.deploy(owner.address, await usdc.getAddress());
    
    await strategy1.setWeaveVault(await testRouter.getAddress());
    await strategy2.setWeaveVault(await testRouter.getAddress());

    await testRouter.addMinitiaVault("Blackwing", await strategy1.getAddress(), 2001, 6000);
    await testRouter.addMinitiaVault("Tucana", await strategy2.getAddress(), 2002, 4000);
    
    await usdc.mint(owner.address, amount);
    await usdc.approve(await testRouter.getAddress(), amount);
    await testRouter.routeCapital(amount);

    const v1 = await testRouter.minitiaVaults(0);
    const v2 = await testRouter.minitiaVaults(1);
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
