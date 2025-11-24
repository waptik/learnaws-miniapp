import { expect } from "chai";
import hre from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { getAddress, parseEther } from "viem";

describe("AssessmentRewards", function () {
  async function deployContractsFixture() {
    const [owner, user1, user2] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    // Deploy token
    const token = await hre.viem.deployContract("AWSRewardToken");

    // Deploy rewards contract
    const rewards = await hre.viem.deployContract("AssessmentRewards", [
      token.address,
    ]);

    // Transfer token ownership to rewards contract
    await token.write.transferOwnership([rewards.address]);

    // Get rewards contract as owner to call owner functions
    const rewardsAsOwner = await hre.viem.getContractAt(
      "AssessmentRewards",
      rewards.address,
      { client: { wallet: owner } }
    );

    return {
      token,
      rewards,
      rewardsAsOwner,
      owner,
      user1,
      user2,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct reward token", async function () {
      const { token, rewards } = await loadFixture(deployContractsFixture);
      expect(getAddress(await rewards.read.rewardToken())).to.equal(getAddress(token.address));
    });

    it("Should set the correct constants", async function () {
      const { rewards } = await loadFixture(deployContractsFixture);
      expect(await rewards.read.TOKENS_PER_PASS()).to.equal(parseEther("1"));
      expect(await rewards.read.MAX_DAILY_CLAIMS()).to.equal(3n);
      expect(await rewards.read.PASSING_SCORE()).to.equal(700n);
    });

    it("Should revert if token address is zero", async function () {
      const zeroAddress = "0x0000000000000000000000000000000000000000" as `0x${string}`;
      await expect(
        hre.viem.deployContract("AssessmentRewards", [zeroAddress])
      ).to.be.rejectedWith("AssessmentRewards: invalid token address");
    });
  });

  describe("Claim Rewards", function () {
    it("Should mint tokens for passing score", async function () {
      const { token, rewards, user1 } = await loadFixture(deployContractsFixture);
      const score = 750n;
      const assessmentId = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as `0x${string}`;

      const rewardsAsUser1 = await hre.viem.getContractAt(
        "AssessmentRewards",
        rewards.address,
        { client: { wallet: user1 } }
      );

      await rewardsAsUser1.write.claimReward([score, assessmentId]);

      expect(await token.read.balanceOf([user1.account.address])).to.equal(
        parseEther("1")
      );
    });

    it("Should revert if score is below passing threshold", async function () {
      const { rewards, user1 } = await loadFixture(deployContractsFixture);
      const score = 650n; // Below 700
      const assessmentId = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as `0x${string}`;

      const rewardsAsUser1 = await hre.viem.getContractAt(
        "AssessmentRewards",
        rewards.address,
        { client: { wallet: user1 } }
      );

      await expect(
        rewardsAsUser1.write.claimReward([score, assessmentId])
      ).to.be.rejectedWith("AssessmentRewards: score below passing threshold");
    });

    it("Should allow multiple claims up to daily limit", async function () {
      const { token, rewards, user1 } = await loadFixture(deployContractsFixture);
      const score = 800n;
      const assessmentId1 = "0x1111111111111111111111111111111111111111111111111111111111111111" as `0x${string}`;
      const assessmentId2 = "0x2222222222222222222222222222222222222222222222222222222222222222" as `0x${string}`;
      const assessmentId3 = "0x3333333333333333333333333333333333333333333333333333333333333333" as `0x${string}`;

      const rewardsAsUser1 = await hre.viem.getContractAt(
        "AssessmentRewards",
        rewards.address,
        { client: { wallet: user1 } }
      );

      // Claim 3 times (max daily limit)
      await rewardsAsUser1.write.claimReward([score, assessmentId1]);
      await rewardsAsUser1.write.claimReward([score, assessmentId2]);
      await rewardsAsUser1.write.claimReward([score, assessmentId3]);

      expect(await token.read.balanceOf([user1.account.address])).to.equal(
        parseEther("3")
      );
    });

    it("Should revert if daily limit is exceeded", async function () {
      const { rewards, user1 } = await loadFixture(deployContractsFixture);
      const score = 800n;
      const assessmentIds = [
        "0x1111111111111111111111111111111111111111111111111111111111111111",
        "0x2222222222222222222222222222222222222222222222222222222222222222",
        "0x3333333333333333333333333333333333333333333333333333333333333333",
        "0x4444444444444444444444444444444444444444444444444444444444444444",
      ] as `0x${string}`[];

      const rewardsAsUser1 = await hre.viem.getContractAt(
        "AssessmentRewards",
        rewards.address,
        { client: { wallet: user1 } }
      );

      // Claim 3 times (max daily limit)
      for (let i = 0; i < 3; i++) {
        await rewardsAsUser1.write.claimReward([score, assessmentIds[i]]);
      }

      // 4th claim should fail
      await expect(
        rewardsAsUser1.write.claimReward([score, assessmentIds[3]])
      ).to.be.rejectedWith("AssessmentRewards: daily limit reached");
    });

    it("Should reset daily limit on next day", async function () {
      const { token, rewards, user1 } = await loadFixture(deployContractsFixture);
      const score = 800n;
      const assessmentId1 = "0x1111111111111111111111111111111111111111111111111111111111111111" as `0x${string}`;
      const assessmentId2 = "0x2222222222222222222222222222222222222222222222222222222222222222" as `0x${string}`;

      const rewardsAsUser1 = await hre.viem.getContractAt(
        "AssessmentRewards",
        rewards.address,
        { client: { wallet: user1 } }
      );

      // Claim 3 times (max daily limit)
      await rewardsAsUser1.write.claimReward([score, assessmentId1]);
      await rewardsAsUser1.write.claimReward([score, assessmentId1]);
      await rewardsAsUser1.write.claimReward([score, assessmentId1]);

      // Advance time by 1 day (86400 seconds)
      await time.increase(86400n);

      // Should be able to claim again
      await rewardsAsUser1.write.claimReward([score, assessmentId2]);

      expect(await token.read.balanceOf([user1.account.address])).to.equal(
        parseEther("4")
      );
    });

    it("Should track claims per user independently", async function () {
      const { token, rewards, user1, user2 } = await loadFixture(
        deployContractsFixture
      );
      const score = 800n;
      const assessmentId = "0x1111111111111111111111111111111111111111111111111111111111111111" as `0x${string}`;

      const rewardsAsUser1 = await hre.viem.getContractAt(
        "AssessmentRewards",
        rewards.address,
        { client: { wallet: user1 } }
      );

      const rewardsAsUser2 = await hre.viem.getContractAt(
        "AssessmentRewards",
        rewards.address,
        { client: { wallet: user2 } }
      );

      // User1 claims 3 times
      await rewardsAsUser1.write.claimReward([score, assessmentId]);
      await rewardsAsUser1.write.claimReward([score, assessmentId]);
      await rewardsAsUser1.write.claimReward([score, assessmentId]);

      // User2 should still be able to claim
      await rewardsAsUser2.write.claimReward([score, assessmentId]);

      expect(await token.read.balanceOf([user1.account.address])).to.equal(
        parseEther("3")
      );
      expect(await token.read.balanceOf([user2.account.address])).to.equal(
        parseEther("1")
      );
    });
  });

  describe("View Functions", function () {
    it("Should return correct canClaim status", async function () {
      const { rewards, user1 } = await loadFixture(deployContractsFixture);
      const score = 800n;
      const assessmentId = "0x1111111111111111111111111111111111111111111111111111111111111111" as `0x${string}`;

      const rewardsAsUser1 = await hre.viem.getContractAt(
        "AssessmentRewards",
        rewards.address,
        { client: { wallet: user1 } }
      );

      // Initially can claim
      expect(await rewards.read.canClaim([user1.account.address])).to.be.true;

      // Claim 3 times
      await rewardsAsUser1.write.claimReward([score, assessmentId]);
      await rewardsAsUser1.write.claimReward([score, assessmentId]);
      await rewardsAsUser1.write.claimReward([score, assessmentId]);

      // Now cannot claim
      expect(await rewards.read.canClaim([user1.account.address])).to.be.false;
    });

    it("Should return correct today claim count", async function () {
      const { rewards, user1 } = await loadFixture(deployContractsFixture);
      const score = 800n;
      const assessmentId = "0x1111111111111111111111111111111111111111111111111111111111111111" as `0x${string}`;

      const rewardsAsUser1 = await hre.viem.getContractAt(
        "AssessmentRewards",
        rewards.address,
        { client: { wallet: user1 } }
      );

      expect(await rewards.read.getTodayClaimCount([user1.account.address])).to.equal(0n);

      await rewardsAsUser1.write.claimReward([score, assessmentId]);
      expect(await rewards.read.getTodayClaimCount([user1.account.address])).to.equal(1n);

      await rewardsAsUser1.write.claimReward([score, assessmentId]);
      expect(await rewards.read.getTodayClaimCount([user1.account.address])).to.equal(2n);
    });

    it("Should return correct current day", async function () {
      const { rewards, publicClient } = await loadFixture(deployContractsFixture);
      const currentBlock = await publicClient.getBlock();
      const expectedDay = BigInt(Math.floor(Number(currentBlock.timestamp) / 86400));

      expect(await rewards.read.getCurrentDay()).to.equal(expectedDay);
    });

    it("Should return correct claim info", async function () {
      const { rewards, user1 } = await loadFixture(deployContractsFixture);
      const score = 800n;
      const assessmentId = "0x1111111111111111111111111111111111111111111111111111111111111111" as `0x${string}`;

      const rewardsAsUser1 = await hre.viem.getContractAt(
        "AssessmentRewards",
        rewards.address,
        { client: { wallet: user1 } }
      );

      const currentDay = await rewards.read.getCurrentDay();

      // Before claim
      const [countBefore, timestampBefore] = await rewards.read.getClaimInfo([
        user1.account.address,
        currentDay,
      ]);
      expect(countBefore).to.equal(0n);
      expect(timestampBefore).to.equal(0n);

      // After claim
      await rewardsAsUser1.write.claimReward([score, assessmentId]);

      const [countAfter, timestampAfter] = await rewards.read.getClaimInfo([
        user1.account.address,
        currentDay,
      ]);
      expect(countAfter).to.equal(1n);
      expect(timestampAfter > 0n).to.be.true;
    });
  });

  describe("Events", function () {
    it("Should emit RewardClaimed event", async function () {
      const { rewards, user1, publicClient } = await loadFixture(
        deployContractsFixture
      );
      const score = 800n;
      const assessmentId = "0x1111111111111111111111111111111111111111111111111111111111111111" as `0x${string}`;

      const rewardsAsUser1 = await hre.viem.getContractAt(
        "AssessmentRewards",
        rewards.address,
        { client: { wallet: user1 } }
      );

      const hash = await rewardsAsUser1.write.claimReward([score, assessmentId]);
      await publicClient.waitForTransactionReceipt({ hash });

      const events = await rewards.getEvents.RewardClaimed();
      expect(events).to.have.lengthOf(1);
      expect(events[0].args.user).to.equal(getAddress(user1.account.address));
      expect(events[0].args.score).to.equal(score);
      expect(events[0].args.assessmentId).to.equal(assessmentId);
      expect(events[0].args.tokensMinted).to.equal(parseEther("1"));
    });

    it("Should emit DailyLimitReached event on 3rd claim", async function () {
      const { rewards, user1, publicClient } = await loadFixture(
        deployContractsFixture
      );
      const score = 800n;
      const assessmentId = "0x1111111111111111111111111111111111111111111111111111111111111111" as `0x${string}`;

      const rewardsAsUser1 = await hre.viem.getContractAt(
        "AssessmentRewards",
        rewards.address,
        { client: { wallet: user1 } }
      );

      // Claim 3 times
      await rewardsAsUser1.write.claimReward([score, assessmentId]);
      await rewardsAsUser1.write.claimReward([score, assessmentId]);
      const hash = await rewardsAsUser1.write.claimReward([score, assessmentId]);
      await publicClient.waitForTransactionReceipt({ hash });

      const events = await rewards.getEvents.DailyLimitReached();
      expect(events).to.have.lengthOf(1);
      expect(events[0].args.user).to.equal(getAddress(user1.account.address));
      expect(events[0].args.claimCount).to.equal(3n);
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to update reward token", async function () {
      const { rewards, owner } = await loadFixture(deployContractsFixture);

      // Deploy new token
      const newToken = await hre.viem.deployContract("AWSRewardToken");

      const rewardsAsOwner = await hre.viem.getContractAt(
        "AssessmentRewards",
        rewards.address,
        { client: { wallet: owner } }
      );

      await rewardsAsOwner.write.setRewardToken([newToken.address]);
      expect(getAddress(await rewards.read.rewardToken())).to.equal(getAddress(newToken.address));
    });

    it("Should revert if non-owner tries to update token", async function () {
      const { rewards, user1 } = await loadFixture(deployContractsFixture);
      const newToken = await hre.viem.deployContract("AWSRewardToken");

      const rewardsAsUser1 = await hre.viem.getContractAt(
        "AssessmentRewards",
        rewards.address,
        { client: { wallet: user1 } }
      );

      await expect(
        rewardsAsUser1.write.setRewardToken([newToken.address])
      ).to.be.rejected;
    });

    it("Should revert if setting token to zero address", async function () {
      const { rewards, owner } = await loadFixture(deployContractsFixture);
      const zeroAddress = "0x0000000000000000000000000000000000000000" as `0x${string}`;

      const rewardsAsOwner = await hre.viem.getContractAt(
        "AssessmentRewards",
        rewards.address,
        { client: { wallet: owner } }
      );

      await expect(
        rewardsAsOwner.write.setRewardToken([zeroAddress])
      ).to.be.rejectedWith("AssessmentRewards: invalid token address");
    });
  });
});

