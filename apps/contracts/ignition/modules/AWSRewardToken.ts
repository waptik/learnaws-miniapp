import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AWSRewardTokenModule = buildModule("AWSRewardTokenModule", (m) => {
  const token = m.contract("AWSRewardToken");

  return { token };
});

export default AWSRewardTokenModule;

