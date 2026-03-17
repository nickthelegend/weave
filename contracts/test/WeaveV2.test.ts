import { expect } from "chai";
import pkg from 'hardhat';
const { ethers } = pkg;

describe("Weave Protocol V2", function () {
  let token: any;
  let veWeave: any;
  let rewards: any;
  let usdc: any;
  let owner: any;
  let user: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20.deploy("Mock USDC", "USDC", 6);

    // Deploy WEAVE Token
    const WeaveToken = await ethers.getContractFactory("WeaveToken");
    token = await WeaveToken.deploy(
        owner.address, // rewardsVault
        owner.address, // teamVesting
        owner.address, // treasury
        owner.address, // airdrop
        owner.address  // partners
    );

    // Deploy veWEAVE
    const VeWeave = await ethers.getContractFactory("VeWeave");
    veWeave = await VeWeave.deploy(await token.getAddress());

    // Deploy Rewards
    const WeaveRewards = await ethers.getContractFactory("WeaveRewards");
    rewards = await WeaveRewards.deploy(await usdc.getAddress(), await veWeave.getAddress());

    // Setup user with WEAVE
    await token.transfer(user.address, ethers.parseUnits("1000", 18));
    await token.connect(user).approve(await veWeave.getAddress(), ethers.parseUnits("1000", 18));
  });

  describe("VeWeave Locking", function () {
    it("Should lock WEAVE and grant veBalance with 1x multiplier for 1 year", async function () {
      const amount = ethers.parseUnits("100", 18);
      await veWeave.connect(user).lock(amount, 2); // 1 year index

      const lock = await veWeave.getUserLock(user.address);
      expect(lock.amount).to.equal(amount);
      expect(lock.veBalance).to.equal(amount); // 1x
      expect(await veWeave.getVotingPower(user.address)).to.equal(amount);
    });

    it("Should grant 4x multiplier for 4 year lock", async function () {
      const amount = ethers.parseUnits("100", 18);
      await veWeave.connect(user).lock(amount, 4); // 4 year index

      const lock = await veWeave.getUserLock(user.address);
      expect(lock.veBalance).to.equal(amount * 4n);
    });

    it("Should prevent transfer of veWEAVE", async function () {
        await expect(veWeave.transfer(owner.address, 100)).to.be.revertedWith("veWEAVE: non-transferable");
    });
  });

  describe("Reward Distribution", function () {
    it("Should distribute USDC to veWEAVE holders", async function () {
        // 1. User locks for power
        await veWeave.connect(user).lock(ethers.parseUnits("100", 18), 2);
        
        // 2. Distribute 100 USDC rewards
        const rewardAmount = ethers.parseUnits("100", 6);
        await usdc.mint(owner.address, rewardAmount);
        await usdc.approve(await rewards.getAddress(), rewardAmount);
        await rewards.distributeRewards(rewardAmount);

        // 3. Check pending
        expect(await rewards.pendingRewards(user.address)).to.equal(rewardAmount);

        // 4. Claim
        const initialBal = await usdc.balanceOf(user.address);
        await rewards.connect(user).claimRewards();
        expect(await usdc.balanceOf(user.address)).to.equal(initialBal + rewardAmount);
    });
  });
});
