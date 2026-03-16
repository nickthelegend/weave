import { expect } from "chai";
import { ethers } from "hardhat";

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

  it("Test 1: Deposit - user deposits 1000 USDC", async function () {
    const depositAmount = 1000000000;
    await vault.connect(user).deposit(depositAmount);

    expect(await vault.userShares(user.address)).to.equal(depositAmount);
    expect(await vault.totalDeposited()).to.equal(depositAmount);
  });

  it("Test 2: Share price increases after harvest", async function () {
    const depositAmount = 1000000000;
    await vault.connect(user).deposit(depositAmount);

    const yieldAmount = 100000000; // 100 USDC yield
    // Need to mint yield to vault so it can be withdrawn
    await usdc.mint(await vault.getAddress(), yieldAmount);
    await vault.harvest(yieldAmount);

    const expectedValue = depositAmount + yieldAmount;
    expect(await vault.getUserValue(user.address)).to.equal(expectedValue);
    expect(await vault.getPricePerShare()).to.be.gt(ethers.parseUnits("1", 18));
  });

  it("Test 3: Withdraw - deposit 1000, harvest 100, withdraw all", async function () {
    const depositAmount = 1000000000;
    await vault.connect(user).deposit(depositAmount);

    const yieldAmount = 100000000;
    await usdc.mint(await vault.getAddress(), yieldAmount);
    await vault.harvest(yieldAmount);

    const shares = await vault.userShares(user.address);
    await vault.connect(user).withdraw(shares);

    expect(await usdc.balanceOf(user.address)).to.equal(1100000000);
  });

  it("Test 4: Multiple users", async function () {
    const user2 = (await ethers.getSigners())[2];
    await usdc.mint(user2.address, 1000000000);
    await usdc.connect(user2).approve(await vault.getAddress(), 1000000000);

    await vault.connect(user).deposit(1000000000);
    await vault.connect(user2).deposit(1000000000);

    const yieldAmount = 200000000;
    await usdc.mint(await vault.getAddress(), yieldAmount);
    await vault.harvest(yieldAmount);

    expect(await vault.getUserValue(user.address)).to.equal(1100000000);
    expect(await vault.getUserValue(user2.address)).to.equal(1100000000);
  });
});
