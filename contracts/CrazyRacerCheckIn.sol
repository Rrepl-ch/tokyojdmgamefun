// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title CrazyRacerCheckIn
 * @dev Daily check-in: 1 call per UTC day. All logic is streak-based (consecutive days).
 *      Every 5th day OF STREAK (5, 10, 15... consecutive) claims 150 tokens.
 *      Day boundary: 00:00 UTC (block.timestamp / 86400).
 */
contract CrazyRacerCheckIn {
    address public immutable rewardToken;
    uint256 public constant REWARD_AMOUNT = 150 * 1e18; // 150 tokens, 18 decimals
    uint256 public constant SECONDS_PER_DAY = 86400;

    mapping(address => uint256) public lastCheckInDay;   // last UTC day index
    mapping(address => uint256) public totalCheckIns;    // total successful check-ins (ever)
    mapping(address => uint256) public streak;             // consecutive days (updated on check-in)

    event CheckedIn(address indexed user, uint256 day, uint256 totalCheckIns, uint256 streak, bool rewardClaimed);

    error AlreadyCheckedInToday();
    error TokenTransferFailed();

    constructor(address _rewardToken) {
        rewardToken = _rewardToken;
    }

    function _currentUtcDay() internal view returns (uint256) {
        return block.timestamp / SECONDS_PER_DAY;
    }

    /// @notice Check in once per UTC day. On every 5th day OF STREAK (5,10,15... consecutive), claims 150 tokens.
    function checkIn() external {
        uint256 today = _currentUtcDay();
        if (lastCheckInDay[msg.sender] == today) revert AlreadyCheckedInToday();

        uint256 last = lastCheckInDay[msg.sender];
        uint256 newStreak = (last == 0 || last == today - 1) ? streak[msg.sender] + 1 : 1;
        streak[msg.sender] = newStreak;
        lastCheckInDay[msg.sender] = today;
        totalCheckIns[msg.sender] += 1;
        bool rewardClaimed = false;

        // 150 tokens every 5 consecutive days (streak 5, 10, 15...)
        if (newStreak % 5 == 0) {
            (bool ok,) = rewardToken.call(
                abi.encodeWithSelector(IERC20.transfer.selector, msg.sender, REWARD_AMOUNT)
            );
            if (!ok) revert TokenTransferFailed();
            rewardClaimed = true;
        }

        emit CheckedIn(msg.sender, today, totalCheckIns[msg.sender], newStreak, rewardClaimed);
    }

    /// @notice Current streak (consecutive days). 10+ = 1.25x, 25+ = 1.5x in game.
    function getStreak(address user) external view returns (uint256) {
        uint256 today = _currentUtcDay();
        if (lastCheckInDay[user] != today && lastCheckInDay[user] != today - 1) return 0;
        return streak[user];
    }

    function getTotalCheckIns(address user) external view returns (uint256) {
        return totalCheckIns[user];
    }

    function getLastCheckInDay(address user) external view returns (uint256) {
        return lastCheckInDay[user];
    }

    function canCheckInToday(address user) external view returns (bool) {
        return lastCheckInDay[user] != _currentUtcDay();
    }
}
