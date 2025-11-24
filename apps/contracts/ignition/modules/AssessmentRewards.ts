import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AssessmentRewardsModule = buildModule("AssessmentRewardsModule", (m) => {
  // Deploy token first
  const token = m.contract("AWSRewardToken");

  // Deploy rewards contract with token address
  const rewards = m.contract("AssessmentRewards", [token]);

  // Transfer token ownership to rewards contract so it can mint
  m.call(token, "transferOwnership", [rewards]);

  return { token, rewards };
});

export default AssessmentRewardsModule;

