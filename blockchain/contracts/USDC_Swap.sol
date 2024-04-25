// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CallOracle} from "./CallOracle.sol";

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

/// @title A very simple swap pool between USDC and ETH
/// @author josevazf
contract USDC_Swap is Ownable {
    /// @notice Address of the oracle contract ETH/USD from Chainlink feed
    CallOracle public oracleContract;
    /// @notice Address of the USDC token contract from Aave
    IERC20 public usdcToken;
    /// @notice Amount of USDC tokens in the pool
    uint256 public usdcPool;

    /// @notice Constructor function
    constructor() {
        // Oracle contract address on Polygon (Matic)
        oracleContract = CallOracle(0xD17ecb6579cAD73aE27596929e13b619bA9060A5);
        // USDC token address on Polygon (Matic)
        usdcToken = IERC20(0x2791bca1f2de4661ed88a30c99a7a9449aa84174);
    }

    // Rest of the contract remains the same...
}
