// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CrazyRacerBonusRace
 * @dev Single function: consumes gas only. Used before starting a race every 5th time (game logic off-chain).
 */
contract CrazyRacerBonusRace {
    event Used(address indexed user, uint256 timestamp);

    function use() external {
        emit Used(msg.sender, block.timestamp);
    }
}
