import { createPublicClient, http } from "viem";
import { selectedChain } from "./chain";

// get rpc url from selected chain
export function getRpcUrl() {
  return selectedChain.rpcUrls.default.http[0];
}

// const RPC_URL = getRpcUrl();

// Create public client for gas estimation
export function getPublicClient() {
  const chain = selectedChain;
  return createPublicClient({
    chain,
    transport: http(),
  });
}

// export const chainId =
