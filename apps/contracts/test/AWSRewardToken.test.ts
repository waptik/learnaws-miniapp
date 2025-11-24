import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { getAddress, parseEther } from "viem";

describe("AWSRewardToken", function () {
  async function deployTokenFixture() {
    const [owner, user1, user2] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const token = await hre.viem.deployContract("AWSRewardToken");

    return {
      token,
      owner,
      user1,
      user2,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct name", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.read.name()).to.equal("AWS Practice Reward");
    });

    it("Should set the correct symbol", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.read.symbol()).to.equal("AWSP");
    });

    it("Should set the correct decimals", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.read.decimals()).to.equal(18);
    });

    it("Should set the correct owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.read.owner()).to.equal(getAddress(owner.account.address));
    });

    it("Should have zero initial supply", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.read.balanceOf([owner.account.address])).to.equal(0n);
    });
  });

  describe("Minting", function () {
    it("Should mint tokens to a user", async function () {
      const { token, user1 } = await loadFixture(deployTokenFixture);
      const amount = parseEther("100");

      await token.write.mintReward([user1.account.address, amount]);

      expect(await token.read.balanceOf([user1.account.address])).to.equal(amount);
    });

    it("Should allow multiple mints to the same user", async function () {
      const { token, user1 } = await loadFixture(deployTokenFixture);
      const amount1 = parseEther("50");
      const amount2 = parseEther("75");

      await token.write.mintReward([user1.account.address, amount1]);
      await token.write.mintReward([user1.account.address, amount2]);

      expect(await token.read.balanceOf([user1.account.address])).to.equal(
        amount1 + amount2
      );
    });

    it("Should allow minting to different users", async function () {
      const { token, user1, user2 } = await loadFixture(deployTokenFixture);
      const amount = parseEther("100");

      await token.write.mintReward([user1.account.address, amount]);
      await token.write.mintReward([user2.account.address, amount]);

      expect(await token.read.balanceOf([user1.account.address])).to.equal(amount);
      expect(await token.read.balanceOf([user2.account.address])).to.equal(amount);
    });

    it("Should revert if minting to zero address", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      const zeroAddress = "0x0000000000000000000000000000000000000000" as `0x${string}`;

      await expect(
        token.write.mintReward([zeroAddress, parseEther("1")])
      ).to.be.rejectedWith("AWSRewardToken: cannot mint to zero address");
    });

    it("Should revert if minting zero amount", async function () {
      const { token, user1 } = await loadFixture(deployTokenFixture);

      await expect(
        token.write.mintReward([user1.account.address, 0n])
      ).to.be.rejectedWith("AWSRewardToken: amount must be greater than zero");
    });

    it("Should revert if called by non-owner", async function () {
      const { token, user1, user2 } = await loadFixture(deployTokenFixture);

      const tokenAsUser = await hre.viem.getContractAt(
        "AWSRewardToken",
        token.address,
        { client: { wallet: user1 } }
      );

      await expect(
        tokenAsUser.write.mintReward([user2.account.address, parseEther("1")])
      ).to.be.rejected;
    });
  });

  describe("ERC20 Functionality", function () {
    it("Should allow token transfers", async function () {
      const { token, owner, user1, user2 } = await loadFixture(deployTokenFixture);
      const amount = parseEther("100");

      await token.write.mintReward([owner.account.address, amount]);
      await token.write.transfer([user1.account.address, amount]);

      expect(await token.read.balanceOf([owner.account.address])).to.equal(0n);
      expect(await token.read.balanceOf([user1.account.address])).to.equal(amount);
    });

    it("Should allow token approvals and transfers", async function () {
      const { token, owner, user1, user2 } = await loadFixture(deployTokenFixture);
      const amount = parseEther("100");

      await token.write.mintReward([owner.account.address, amount]);
      await token.write.approve([user1.account.address, amount]);

      const tokenAsUser1 = await hre.viem.getContractAt(
        "AWSRewardToken",
        token.address,
        { client: { wallet: user1 } }
      );

      await tokenAsUser1.write.transferFrom([
        owner.account.address,
        user2.account.address,
        amount,
      ]);

      expect(await token.read.balanceOf([user2.account.address])).to.equal(amount);
    });
  });
});

