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
    g6Token = G6Token(0xb46b5C88464E2DCeE987f159f6cF1066B52A360D);
    oracleContract = CallOracle(0xD17ecb6579cAD73aE27596929e13b619bA9060A5);
    usdcToken = IERC20(0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8);
  }
  
  /// @notice Passes when `amount` is above 0
  modifier minValue(uint256 amount) {
    require(amount > 0, "Value not accepted");
    _;
  }

  // @notice Gets ETH price from oracle
  function getETHPrice() public view returns (uint256 ethPrice) {
    return uint256(oracleContract.getEthUsdPrice()) / 100;
  }

  // @notice Gets USDC value for a given `amount` of ETH
  function getUSDCValue_ETH(uint256 amount) public view returns (uint256) {
    return (amount * getETHPrice())/(1 ether);
  }

  // @notice Gets G6T value for a given `amount`of USDC 
  function getG6TValue_USDC(uint256 amount) public view returns (uint256) {
    uint256 value = (amount * 10000) / getETHPrice();
    return value * (1 ether);
  }
  
  /// @notice Returns the total USDC debt of passed `account`
  function totalDebtOf(address account) public view returns (uint256 totalDebt) {
    if (user[account].time_withdrawB_USDC == 0)
      return 0;
    totalDebt = user[account].withdrawB_USDC + totalFeeOf(account);
    return totalDebt;
  }

  /// @notice Returns accrued USDC interest fee of passed `account`
  function totalFeeOf(address account) public view returns (uint256 tempFee) {
    if (user[account].time_withdrawB_USDC == 0)
      return 0;
    uint256 elapsedTime = block.timestamp - user[account].time_withdrawB_USDC;
    // @dev Interest rate APR:5.00%
    tempFee = user[account].interestFee + elapsedTime * (user[account].withdrawB_USDC / 6307200);
    return tempFee;
  }

  /// @notice Returns the total USDC Lender deposit rewards of passed `account`
  function totalUSDCRewards_L(address account) public view returns (uint256) {
    if (user[account].time_depositL_USDC == 0)
      return 0;
    uint256 elapsedTime = block.timestamp - user[account].time_depositL_USDC;
    // @dev Reward rate APR:3.00%
    uint256 totalRewardsUSDC = user[account].reward_depositL_USDC + elapsedTime * (user[account].depositL_USDC / 10512000);
    return totalRewardsUSDC;
  }

  /// @notice Deposits USDC `amount` to the Lending Pool
  /// @dev    Lender Dashboard
  function depositUSDC_L(uint256 amount) external minValue(amount){
    if (msg.sender == owner()) {
      usdcToken.transferFrom(msg.sender, address(this), amount);
    } else if (user[msg.sender].time_depositL_USDC != 0) {
      user[msg.sender].reward_depositL_USDC += totalUSDCRewards_L(msg.sender);
      usdcToken.transferFrom(msg.sender, address(this), amount);
      user[msg.sender].time_depositL_USDC = block.timestamp;
    } else {
      usdcToken.transferFrom(msg.sender, address(this), amount);
      user[msg.sender].time_depositL_USDC = block.timestamp;
    }
    user[msg.sender].depositL_USDC += amount;
    lendingPool += amount;
  }

  /// @notice Withdraws USDC `amount` from the Lending Pool
  /// @dev    Lender Dashboard
  function withdrawUSDC_L(uint256 amount) external minValue(amount){
    require(amount <= user[msg.sender].depositL_USDC, "Cannot withdraw more than what you deposited");
    uint256 rewards = getG6TValue_USDC(totalUSDCRewards_L(msg.sender));
    if (amount == user[msg.sender].depositL_USDC)
      user[msg.sender].time_depositL_USDC = 0;
    else
      user[msg.sender].time_depositL_USDC = block.timestamp;
    user[msg.sender].depositL_USDC -= amount;
    lendingPool -= amount;
    user[msg.sender].reward_depositL_USDC = 0;
    usdcToken.transfer(msg.sender, amount);
    g6Token.mint(msg.sender, rewards);
  }

  /// @notice Returns the total USDC Collateral ETH deposit rewards of passed `account`
  /// @dev    Borrower Dashboard
  function totalUSDCRewards_C(address account) public view returns (uint256) {
    if (user[account].time_depositC_ETH == 0)
      return 0;
    uint256 elapsedTime = block.timestamp - user[account].time_depositC_ETH;
    // @dev Reward rate APR:2.00%
    uint256 totalRewardsUSDC = user[account].reward_depositC_ETH + elapsedTime * (getUSDCValue_ETH(user[account].depositC_ETH) / 15768000);
    return totalRewardsUSDC;
  }

  /// @notice Deposits ETH tokens as Collateral and sets borrowing limit to 80% of ETH value in USDC
  /// @dev    Borrower Dashboard
  /// @dev This implementation is prone to rounding problems
  function depositETH_C() public payable {
    if (user[msg.sender].time_depositC_ETH != 0)
      user[msg.sender].reward_depositC_ETH += totalUSDCRewards_C(msg.sender);
    user[msg.sender].time_depositC_ETH = block.timestamp;
    user[msg.sender].depositC_ETH += msg.value;
    uint256 usdcC_Value = (getUSDCValue_ETH(user[msg.sender].depositC_ETH) * 8) / 10;
    user[msg.sender].availableB_USDC = usdcC_Value - user[msg.sender].withdrawB_USDC;
  }

  /// @notice Whithdraws `amount` of deposited ETH to the owner
  function withdrawETH_C(uint256 amount) external minValue(amount){
    require(amount <= user[msg.sender].depositC_ETH, "Cannot withdraw more than what you deposited");
    uint256 ethLeft = user[msg.sender].depositC_ETH - amount;
    require(((getUSDCValue_ETH(ethLeft) * 8) / 10) >= totalDebtOf(msg.sender), "Current debt is above 80% of collateral value left");
    uint256 rewards = getG6TValue_USDC(totalUSDCRewards_C(msg.sender));
    if (amount == user[msg.sender].depositC_ETH)
      user[msg.sender].time_depositC_ETH = 0;
    else
      user[msg.sender].time_depositC_ETH = block.timestamp;
    user[msg.sender].reward_depositC_ETH = 0;
    g6Token.mint(msg.sender, rewards);
    (bool ok,) = msg.sender.call{value: amount}("");
    require(ok, "Failed to withdraw");
  }

  /// @notice Borrow USDC `amount` from the Lending Pool
  /// @dev    Borrower Dashboard
  function borrowUSDC_B(uint256 amount) external minValue(amount){
    require(amount <= user[msg.sender].availableB_USDC, "Cannot borrow more than allowed");
    require(amount <= ((lendingPool * 5 )/ 10), "Can't borrow more than 50% of the Lending Pool");
    if (user[msg.sender].interestFee != 0)
      user[msg.sender].interestFee = totalFeeOf(msg.sender);
    user[msg.sender].availableB_USDC -= amount;
    user[msg.sender].withdrawB_USDC += amount;
    lendingPool -= amount;
    borrowTV += amount;
    user[msg.sender].time_withdrawB_USDC = block.timestamp;
    usdcToken.transfer(msg.sender, amount);
  }

  /// @notice Repay borrowed USDC plus Interes Fees `amount` to the Lending Pool
  /// @dev    Borrower Dashboard
  function repayUSDC_B(uint256 amount) external minValue(amount){
    uint256 totalDebt = totalDebtOf(msg.sender);
    user[msg.sender].interestFee = totalFeeOf(msg.sender);
    // @dev Contract only charges for the totalDebt, safer to set amount above totalDebt to guarantee total repay
    if (amount >= totalDebt) {
      usdcToken.transferFrom(msg.sender, address(this), totalDebt);
      user[msg.sender].availableB_USDC += (getUSDCValue_ETH(user[msg.sender].depositC_ETH) * 8) / 10;
      lendingPool += user[msg.sender].withdrawB_USDC;
      feesPool += user[msg.sender].interestFee;
      borrowTV -= user[msg.sender].withdrawB_USDC;
      user[msg.sender].withdrawB_USDC = 0;
      user[msg.sender].interestFee = 0;
      user[msg.sender].time_withdrawB_USDC = 0;
    } else if (amount >= user[msg.sender].interestFee) {
      usdcToken.transferFrom(msg.sender, address(this), amount);
      user[msg.sender].time_withdrawB_USDC = block.timestamp;
      uint256 amountDif = amount - user[msg.sender].interestFee;
      feesPool += user[msg.sender].interestFee;
      user[msg.sender].interestFee = 0;
      user[msg.sender].availableB_USDC += amountDif;
      lendingPool += amountDif;
      borrowTV -= amountDif;
      user[msg.sender].withdrawB_USDC -= amountDif;
    } else { // if amount is less then interestFee
      usdcToken.transferFrom(msg.sender, address(this), amount);
      feesPool += amount;
      user[msg.sender].interestFee -= amount;
    }
  }

  /// @notice Receive function allows to receive ETH when no calldata is passed
  receive() external payable {
    depositETH_C();
  }
}
