// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {G6Token} from "./G6Token.sol";
import {CallOracle} from "./CallOracle.sol";

interface IERC20 {
  function balanceOf(address account) external view returns (uint256);
  function transfer(address recipient, uint256 amount) external returns (bool);
  function allowance(address owner, address spender) external view returns (uint256);
  function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

/// @title Group 6 Lending Protocol
/// @author josevazf
/// @notice This contract implements a simple lending application
/// @custom:poc This is a contract meant to be a proof of concept
contract LendingProtocol is Ownable {
    /// @notice Address of the oracle contract ETH/USD from Chainlink feed
    CallOracle public oracleContract;
    /// @notice Address of the USDC token contract from Aave
    IERC20 public usdcToken;
    /// @notice Address of the G6T token used to distribute rewards to users
    G6Token public g6Token;

    /// @notice Struct to keep track of users positions
    struct UserInfo {
        uint256 depositL_USDC;          // USDC deposited (Lending)
        uint256 time_depositL_USDC;     // Time of USDC deposit (Lending)
        uint256 reward_depositL_USDC;   // USDC rewards from deposit (Lending) given as G6T
        uint256 depositC_ETH;           // ETH deposited (Collateral)
        uint256 time_depositC_ETH;      // Time of ETH deposit (Collateral)
        uint256 reward_depositC_ETH;    // USDC rewards from deposit (Collateral) given as G6T
        uint256 availableB_USDC;        // Available USDC to borrow 80% of ETH value in USDC (Borrowing)
        uint256 withdrawB_USDC;         // USDC withdrawn (Borrowing)
        uint256 time_withdrawB_USDC;    // Time of USDC withdraw (Borrowing)
        uint256 interestFee;            // Interest USDC fee
    }

    /// @notice Mapping for the address of each user struct element
    mapping (address => UserInfo) public user;
    /// @notice Amount of tokens in the Lending Pool
    uint256 public lendingPool;
    /// @notice Amount of tokens in the Fees Pool
    uint256 public feesPool;
    /// @notice Amount of USDC borrowed
    uint256 public borrowTV;

    /// @notice Constructor function
    constructor() {
        g6Token = G6Token(0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39);
        oracleContract = CallOracle(0xD17ecb6579cAD73aE27596929e13b619bA9060A5);
        // USDC token address on Polygon (Matic)
        usdcToken = IERC20(0x2791bca1f2de4661ed88a30c99a7a9449aa84174);
    }
  
    // Rest of the contract remains the same...
}
