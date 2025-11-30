// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AWSRewardToken.sol";

/**
 * @title AssessmentRewards
 * @dev Contract that manages token rewards for passing AWS certification assessments
 * @notice Enforces daily limits and validates assessment scores
 */
contract AssessmentRewards is Ownable, ReentrancyGuard {
    AWSRewardToken public rewardToken;

    // Constants
    uint256 public constant TOKENS_PER_PASS = 1e18; // 1 token (with 18 decimals)
    uint256 public constant MAX_DAILY_CLAIMS = 3;
    uint256 public constant PASSING_SCORE = 700; // Minimum score to pass (out of 1000)

    // Daily claim tracking
    struct DailyClaim {
        uint256 count;              // Number of claims on this day
        uint256 lastClaimTimestamp; // Timestamp of last claim
    }

    // Mapping: user address => day (UTC day number) => DailyClaim
    mapping(address => mapping(uint256 => DailyClaim)) public dailyClaims;

    // Events
    event RewardClaimed(
        address indexed user,
        uint256 score,
        bytes32 indexed assessmentId,
        uint256 tokensMinted,
        uint256 day,
        string courseCode
    );

    event DailyLimitReached(
        address indexed user,
        uint256 day,
        uint256 claimCount
    );

    /**
     * @dev Constructor that sets the reward token contract
     * @param _rewardToken Address of the AWSRewardToken contract
     */
    constructor(address _rewardToken) Ownable(msg.sender) {
        require(_rewardToken != address(0), "AssessmentRewards: invalid token address");
        rewardToken = AWSRewardToken(_rewardToken);
    }

    /**
     * @dev Claim reward tokens for passing an assessment
     * @param score Assessment score (100-1000)
     * @param assessmentId Unique identifier for the assessment
     * @param courseCode Course code (e.g., "CLF-C02" for certification courses, "aws-basics" for non-certification)
     * @notice Requires score >= 700 and user must not exceed daily limit
     */
    function claimReward(
        uint256 score, 
        bytes32 assessmentId,
        string memory courseCode
    ) 
        external 
        nonReentrant 
    {
        require(score >= PASSING_SCORE, "AssessmentRewards: score below passing threshold");
        
        address user = msg.sender;
        uint256 currentDay = getCurrentDay();
        
        // Check daily limit
        DailyClaim storage claim = dailyClaims[user][currentDay];
        require(claim.count < MAX_DAILY_CLAIMS, "AssessmentRewards: daily limit reached");
        
        // Update claim count
        claim.count++;
        claim.lastClaimTimestamp = block.timestamp;
        
        // Mint tokens
        rewardToken.mintReward(user, TOKENS_PER_PASS);
        
        emit RewardClaimed(user, score, assessmentId, TOKENS_PER_PASS, currentDay, courseCode);
        
        // Emit event if user reached daily limit
        if (claim.count == MAX_DAILY_CLAIMS) {
            emit DailyLimitReached(user, currentDay, claim.count);
        }
    }

    /**
     * @dev Check if a user can claim rewards (hasn't exceeded daily limit)
     * @param user Address to check
     * @return bool True if user can claim, false otherwise
     */
    function canClaim(address user) external view returns (bool) {
        uint256 currentDay = getCurrentDay();
        DailyClaim memory claim = dailyClaims[user][currentDay];
        return claim.count < MAX_DAILY_CLAIMS;
    }

    /**
     * @dev Get the number of claims a user has made today
     * @param user Address to check
     * @return uint256 Number of claims today
     */
    function getTodayClaimCount(address user) external view returns (uint256) {
        uint256 currentDay = getCurrentDay();
        return dailyClaims[user][currentDay].count;
    }

    /**
     * @dev Get the current UTC day number (days since epoch)
     * @return uint256 Current day number
     * @notice Uses UTC day to ensure consistent daily reset across timezones
     */
    function getCurrentDay() public view returns (uint256) {
        // UTC day = timestamp / seconds per day
        // Using 86400 seconds per day
        return block.timestamp / 86400;
    }

    /**
     * @dev Get claim information for a user on a specific day
     * @param user Address to check
     * @param day Day number (UTC)
     * @return count Number of claims on that day
     * @return lastClaimTimestamp Timestamp of last claim on that day
     */
    function getClaimInfo(address user, uint256 day) 
        external 
        view 
        returns (uint256 count, uint256 lastClaimTimestamp) 
    {
        DailyClaim memory claim = dailyClaims[user][day];
        return (claim.count, claim.lastClaimTimestamp);
    }

    /**
     * @dev Update the reward token contract address (owner only)
     * @param _rewardToken New token contract address
     * @notice Use with caution - should only be used for upgrades
     */
    function setRewardToken(address _rewardToken) external onlyOwner {
        require(_rewardToken != address(0), "AssessmentRewards: invalid token address");
        rewardToken = AWSRewardToken(_rewardToken);
    }
}

