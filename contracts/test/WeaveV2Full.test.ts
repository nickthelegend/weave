import { expect } from "chai";
import pkg from 'hardhat';
const { ethers } = pkg;

describe("Weave V2 Governance", function () {
  let token: any;
  let veWeave: any;
  let rewards: any;
  let gauge: any;
  let vesting: any;
  let usdc: any;
  let owner: any;
  let user: any;
  let team: any;

  beforeEach(async function () {
    [owner, user, team] = await ethers.getSigners();

    // 1. Tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20.deploy("Mock USDC", "USDC", 6);
    
    const WeaveToken = await ethers.getContractFactory("WeaveToken");
    token = await WeaveToken.deploy(owner.address, owner.address, owner.address, owner.address, owner.address);

    // 2. veWEAVE
    const VeWeave = await ethers.getContractFactory("VeWeave");
    veWeave = await VeWeave.deploy(await token.getAddress());

    // 3. Rewards
    const WeaveRewards = await ethers.getContractFactory("WeaveRewards");
    rewards = await WeaveRewards.deploy(await usdc.getAddress(), await veWeave.getAddress());

    // 4. Gauge
    const WeaveGauge = await ethers.getContractFactory("WeaveGauge");
    gauge = await WeaveGauge.deploy(await veWeave.getAddress());

    // 5. Vesting (20M)
    const WeaveVesting = await ethers.getContractFactory("WeaveVesting");
    vesting = await WeaveVesting.deploy(await token.getAddress(), team.address, ethers.parseUnits("20000000", 18));

    // Setup user
    await token.transfer(user.address, ethers.parseUnits("1000", 18));
    await token.connect(user).approve(await veWeave.getAddress(), ethers.parseUnits("1000", 18));
  });

  it("Test 1: Total supply = 100M", async function () {
    expect(await token.totalSupply()).to.equal(ethers.parseUnits("100000000", 18));
  });

  it("Test 3: Lock 1000 WEAVE 4yr -> get 4000 veWEAVE", async function () {
    const amount = ethers.parseUnits("1000", 18);
    await veWeave.connect(user).lock(amount, 4); // 4 year index
    expect(await veWeave.getVotingPower(user.address)).to.equal(amount * 4n);
  });

  it("Test 4: Lock 1000 WEAVE 1yr -> get 1000 veWEAVE", async function () {
    const amount = ethers.parseUnits("1000", 18);
    // Note: index 2 is 365 days
    await veWeave.connect(user).lock(amount, 2); 
    expect(await veWeave.getVotingPower(user.address)).to.equal(amount);
  });

  it("Test 5: veWEAVE non-transferable", async function () {
    await expect(veWeave.transfer(user.address, 100)).to.be.revertedWith("veWEAVE: non-transferable");
  });

  it("Test 6: Cannot unlock before lockEnd", async function () {
    await veWeave.connect(user).lock(ethers.parseUnits("100", 18), 2);
    await expect(veWeave.connect(user).unlock()).to.be.revertedWith("Lock not expired");
  });

  it("Test 7: Rewards distributed proportionally", async function () {
    await veWeave.connect(user).lock(ethers.parseUnits("100", 18), 2);
    
    const rewardAmt = ethers.parseUnits("100", 6);
    await usdc.mint(owner.address, rewardAmt);
    await usdc.approve(await rewards.getAddress(), rewardAmt);
    await rewards.distributeRewards(rewardAmt);

    expect(await rewards.pendingRewards(user.address)).to.equal(rewardAmt);
  });

  it("Test 8: Team cannot claim before 2yr cliff", async function () {
    await expect(vesting.connect(team).claim()).to.be.revertedWith("Vesting: cliff not reached");
  });

  it("Test 9: Gauge votes change allocations", async function () {
    await gauge.addGauge("Initia DEX", owner.address);
    await veWeave.connect(user).lock(ethers.parseUnits("100", 18), 2);
    
    await gauge.connect(user).vote(0, ethers.parseUnits("100", 18)); // Using 100 veWEAVE
    const g = await gauge.getGauge(0);
    expect(g.totalVotes).to.equal(ethers.parseUnits("100", 18));
  });

  it("Test 10: Epoch finalizes correctly", async function () {
    await gauge.addGauge("Initia DEX", owner.address);
    await veWeave.connect(user).lock(ethers.parseUnits("100", 18), 2);
    await gauge.connect(user).vote(0, ethers.parseUnits("100", 18));

    // Fast forward 8 days
    await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
    await gauge.finalizeEpoch();

    const g = await gauge.getGauge(0);
    expect(g.allocation).to.equal(10000); // 100%
  });
});
