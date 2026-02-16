// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../CrazyRacerCars.sol";

contract DeployScript is Script {
    function run() external {
        address treasury = 0x218d863fd2acfea01042ca7b11a38ec06f78bb76;
        string memory baseURI = "https://crazyracer.app/api/nft/";

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        new CrazyRacerCars(treasury, baseURI);
        vm.stopBroadcast();
    }
}
