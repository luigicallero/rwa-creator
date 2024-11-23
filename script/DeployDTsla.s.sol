// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {dTSLA} from "../src/dTSLA.sol";

contract DeployDTsla is Script {
    string constant alpacaMintSource = "./functions/sources/alpacaBalance.js";
    string constant alpacaRedeemSource = "";
    uint64 constant subID = 3661;
    
    function run() public {
        string memory mintSource = vm.readFile(alpacaMintSource);

        vm.startBroadcast();
        dTSLA dTsla = new dTSLA(mintSource, subID ,alpacaRedeemSource);
        vm.stopBroadcast();

        console.log(address(dTsla));
    }
}