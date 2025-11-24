// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AWSRewardToken
 * @dev ERC20 token for AWS certification practice assessment rewards
 * @notice Mintable by owner (AssessmentRewards contract)
 */
contract AWSRewardToken is ERC20, Ownable {
    /**
     * @dev Constructor that sets token name, symbol, and decimals
     */
    constructor() ERC20("AWS Practice Reward", "AWSP") Ownable(msg.sender) {}

    /**
     * @dev Mint tokens to a user address
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint (in wei, 1e18 = 1 token)
     * @notice Only callable by owner (AssessmentRewards contract)
     */
    function mintReward(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "AWSRewardToken: cannot mint to zero address");
        require(amount > 0, "AWSRewardToken: amount must be greater than zero");
        
        _mint(to, amount);
    }

    /**
     * @dev Get token decimals (always 18)
     * @return uint8 Number of decimals
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}

