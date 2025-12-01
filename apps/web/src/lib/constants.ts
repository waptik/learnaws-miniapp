export const APP_NAME = "LearnAWS";
export const APP_FULL_NAME = "Learn AWS";
export const APP_DESCRIPTION =
  "A miniapp to prepare yourself for aws certifications";
export const APP_URL = "https://learnaws.com";
export const APP_ICON = "https://learnaws.com/icon.png";
export const APP_IMAGE = "https://learnaws.com/opengraph-image.png";
export const APP_TWITTER = "https://twitter.com/learnaws";
export const APP_GITHUB = "https://github.com/learnaws";
export const APP_LINKEDIN = "https://linkedin.com/company/learnaws";
export const APP_FACEBOOK = "https://facebook.com/learnaws";
export const APP_INSTAGRAM = "https://instagram.com/learnaws";
export const APP_YOUTUBE = "https://youtube.com/learnaws";
export const YOUTUBE_DEMO_URL = "https://www.youtube.com/watch?v=uNDX3iFxiZM";
export const FARCASTER_MINIAPP_URL =
  "https://farcaster.xyz/miniapps/md4TFUyA4VPc/learn-aws";

// contract addresses: { chain: contractAddress }
export const CONTRACT_ADDRESSES = {
  celo: {
    AWSRewardToken: "0xc4A1f437720FF4C1cdfB88AbE4b1d9619fEf8e8b",
    AssessmentRewards: "0x4fC99200198F74dbB089e7cf189A291188A85743",
  },
  celoSepolia: {
    AWSRewardToken: "0xC24B7437170e222d99D0652b58335653c446DBAd",
    AssessmentRewards: "0x7f9E876a1A40DeCA8BFe67Ed1bD8ba50F68b01d3",
  },
} as const;
