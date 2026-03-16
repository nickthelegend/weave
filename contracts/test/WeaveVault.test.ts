import { expect } from "chai";
import pkg from 'hardhat';
const { ethers } = pkg;

describe("WeaveVault", function () {
  let vault: any;
  let usdc: any;
  let owner: any;
  let user: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20.deploy("Mock USDC", "USDC", 6);

    const WeaveVault = await ethers.getContractFactory("WeaveVault");
    vault = await WeaveVault.deploy(await usdc.getAddress());

    await usdc.mint(user.address, 1000000000); // 1000 USDC
    await usdc.connect(user).approve(await vault.getAddress(), 1000000000);
  });

  it("Test 1: Deposit mints correct shares", async function () {
    const depositAmount = 1000000000;
    await vault.connect(user).deposit(depositAmount);

    expect(await vault.userShares(user.address)).to.equal(depositAmount);
    expect(await vault.totalDeposited()).to.equal(depositAmount);
  });

  it("Test 2: Price per share increases after harvest", async function () {
    const depositAmount = 1000000000;
    await vault.connect(user).deposit(depositAmount);

    const yieldAmount = 100000000; // 100 USDC yield
    await usdc.mint(await vault.getAddress(), yieldAmount);
    await vault.harvest(yieldAmount);

    const price = await vault.getPricePerShare();
    expect(price).to.be.gt(1000000); // 1.0 USDC
  });

  it("Test 3: Protocol fee deducted correctly (10%)", async function () {
    const depositAmount = 1000000000;
    await vault.connect(user).deposit(depositAmount);

    const yieldAmount = 100000000; // 100 USDC
    await usdc.mint(await vault.getAddress(), yieldAmount);
    await vault.harvest(yieldAmount);

    const stats = await vault.getVaultStats();
    expect(stats._totalProtocolFeesAccrued).to.equal(10000000); // 10 USDC (10%)
    expect(stats._totalYieldGenerated).to.equal(yieldAmount);
  });

  it("Test 4: Withdraw returns correct USDC after yield", async function () {
    const depositAmount = 1000000000;
    await vault.connect(user).deposit(depositAmount);

    const yieldAmount = 100000000;
    await usdc.mint(await vault.getAddress(), yieldAmount);
    await vault.harvest(yieldAmount);

    const shares = await vault.userShares(user.address);
    await vault.connect(user).withdraw(shares);

    // 1000 principal + 90 net yield (100 - 10% fee)
    expect(await usdc.balanceOf(user.address)).to.equal(1090000000);
  });

  it("Test 5: Multiple users get proportional yield", async function () {
    const user2 = (await ethers.getSigners())[2];
    await usdc.mint(user2.address, 1000000000);
    await usdc.connect(user2).approve(await vault.getAddress(), 1000000000);

    await vault.connect(user).deposit(1000000000);
    await vault.connect(user2).deposit(1000000000);

    const yieldAmount = 200000000;
    await usdc.mint(await vault.getAddress(), yieldAmount);
    await vault.harvest(yieldAmount);

    // Each user gets 1000 + 90
    expect(await vault.getUserValue(user.address)).to.equal(1090000000);
    expect(await vault.getUserValue(user2.address)).to.equal(1090000000);
  });

  it("Test 6: Pause blocks deposits and withdrawals", async function () {
    await vault.setPaused(true);
    await expect(vault.connect(user).deposit(1000000)).to.be.revertedWithCustomError(vault, "EnforcedPause");
    
    await vault.setPaused(false);
    await vault.connect(user).deposit(1000000000);
    
    await vault.setPaused(true);
    await expect(vault.connect(user).withdraw(1000000)).to.be.revertedWithCustomError(vault, "EnforcedPause");
  });

  it("Test 7: Only keeper can harvest", async function () {
    await expect(vault.connect(user).harvest(1000000)).to.be.revertedWith("Not keeper");
  });
});
