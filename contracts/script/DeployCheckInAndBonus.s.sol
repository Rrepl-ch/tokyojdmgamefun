// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../CrazyRacerCheckIn.sol";
import "../CrazyRacerBonusRace.sol";
import "../CrazyRacerScoreReward.sol";

contract DeployCheckInAndBonus is Script {
    address constant REWARD_TOKEN = 0xfdaaded27faba8ccb82154fb4641b13cca2d27f5;

    function run() external {
        address signer = vm.envOr("SCORE_REWARD_SIGNER", vm.addr(vm.envUint("PRIVATE_KEY")));
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        CrazyRacerCheckIn checkIn = new CrazyRacerCheckIn(REWARD_TOKEN);
        CrazyRacerBonusRace bonus = new CrazyRacerBonusRace();
        CrazyRacerScoreReward scoreReward = new CrazyRacerScoreReward(REWARD_TOKEN, signer);
        vm.stopBroadcast();
        console.log("CrazyRacerCheckIn", address(checkIn));
        console.log("CrazyRacerBonusRace", address(bonus));
        console.log("CrazyRacerScoreReward", address(scoreReward));
    }
}
