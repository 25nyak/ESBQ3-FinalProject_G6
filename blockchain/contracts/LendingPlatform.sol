// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {G6Token} from "./G6Token.sol";
import {CallOracle} from "./CallOracle.sol";

interface IERC20 {
  function balanceOf(address account) external view returns (uint256);
  function transfer(address recipient, uint256 amount) external returns (bool);
  function allowance(address owner, address spender) external view returns (uint256);
  function approve(address spender, uint256 amount) external returns (bool);
  function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

/// @title Group 6 Lending Plaform
/// @author josevazf
/// @notice This contract implements a simple lending platform
/// @custom:poc This is a contract meant to be a proof of concept
contract LendingPlatform is Ownable {
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
    uint256 g6tReward_deposit;      // G6T rewards from deposit (Lending)
    uint256 usdcReward_deposit;     // USDC rewards from protocol fees
    uint256 depositC_ETH;           // ETH deposited (Collateral)
    uint256 time_depositC_ETH;      // Time of ETH deposit (Collateral)
    uint256 availableB_USDC;        // Available USDC to borrow (Borrowing)
    uint256 withdrawB_USDC;         // USDC withdrawn (Borrowing)
    uint256 time_withdrawB_USDC;    // Time of USDC withdraw (Borrowing)
    uint256 interestFee;            // Interest USDC fee
  }

  /// @notice Mapping for the address of each user struct element
  mapping (address => UserInfo) public user;
  /// @dev List of users addresses
  address[] public userList;
  /// @notice Amount of tokens in the Lending Pool
  uint256 public lendingPool;
  /// @notice Amount of tokens in the Fees Pool
  uint256 public feesPool;

  /// @notice Constructor function
  constructor() {
    g6Token = G6Token(0xba64c03e45cc1E3Fe483dBDB3A671DBa7a0Ab7cD);
    oracleContract = CallOracle(0xD17ecb6579cAD73aE27596929e13b619bA9060A5);
    usdcToken = IERC20(0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8);
  }
  
  /// @notice Passes when `amount` is above 0
  modifier minValue(uint256 amount) {
    require(amount > 0, "Value not accepted");
    _;
  }

  // @notice Function to check if an address exists in userList
  function addressExists(address _addr) public view returns (bool) {
    for (uint256 i = 0; i < userList.length; i++) {
      if (userList[i] == _addr) {
        return true;
      }
    }
    return false;
  }

  // @notice Function to add an address to userList if it doesn't exist
  function addAddressIf(address _addr) public {
    if (!addressExists(_addr))
      userList.push(_addr);
  }

  // @notice Gets ETH price from oracle
  function getETHPrice() public view returns (uint256 ethPrice) {
    return uint256(oracleContract.getEthUsdPrice()) / 100;
  }

  // @notice Gets USDC value for a given `amount` of ETH
  function getUSDCValue(uint256 amount) public view returns (uint256 usdcValue) {
    return (amount * getETHPrice())/(1 ether);
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
    tempFee = user[account].interestFee + elapsedTime * (user[account].withdrawB_USDC / 10000); // Pays a fee of 0.0001% per second/8.64% per day
    return tempFee;
  }

  /// @notice Deposits USDC `amount` to the Lending Pool
  /// @dev    Lender Dashboard
  function depositUSDC(uint256 amount) external minValue(amount){
    if (msg.sender == owner()) {
      usdcToken.transferFrom(msg.sender, address(this), amount);
      user[msg.sender].depositL_USDC += amount;
      lendingPool += amount;
    } else {
      addAddressIf(msg.sender);
      usdcToken.transferFrom(msg.sender, address(this), amount);
      user[msg.sender].depositL_USDC += amount;
      user[msg.sender].time_depositL_USDC = block.timestamp;
      lendingPool += amount;
    }
  }

  /// @notice Withdraws USDC `amount` from the Lending Pool
  /// @dev    Lender Dashboard
  function withdrawUSDC(uint256 amount) external minValue(amount){
    require(amount <= user[msg.sender].depositL_USDC, "Can't withdraw more than what you deposited");
    user[msg.sender].depositL_USDC -= amount;
    lendingPool -= amount;
    usdcToken.transfer(msg.sender, amount);
  }

  /// @notice Deposits ETH tokens as Collateral and sets borrowing limit to 80% of ETH value in USDC
  /// @dev    Borrower Dashboard
  /// @dev This implementation is prone to rounding problems
  function depositETH() external payable {
    addAddressIf(msg.sender);
    user[msg.sender].depositC_ETH += msg.value;
    uint256 usdcValue = getUSDCValue(user[msg.sender].depositC_ETH);
    user[msg.sender].availableB_USDC += (usdcValue * 8) / 10;
  }

  /// @notice Borrow USDC `amount` from the Lending Pool
  /// @dev    Borrower Dashboard
  function borrowUSDC(uint256 amount) external minValue(amount){
    require(amount <= user[msg.sender].availableB_USDC, "Can't withdraw more than allowed");
    if (user[msg.sender].interestFee != 0)
      user[msg.sender].interestFee = totalFeeOf(msg.sender);
    user[msg.sender].availableB_USDC -= amount;
    user[msg.sender].withdrawB_USDC += amount;
    lendingPool -= amount;  
    user[msg.sender].time_withdrawB_USDC = block.timestamp;
    usdcToken.transfer(msg.sender, amount);
  }

  /// @notice Repay borrowed USDC plus Interes Fees `amount` to the Lending Pool
  /// @dev    Borrower Dashboard
  function repayUSDC(uint256 amount) external minValue(amount){
    uint256 totalDebt = totalDebtOf(msg.sender);
    user[msg.sender].interestFee = totalFeeOf(msg.sender);
    // @dev Contract only charges for the totalDebt, safer to set amount above totalDebt to guarantee total repay
    if (amount >= totalDebt) {
      usdcToken.transferFrom(msg.sender, address(this), totalDebt);
      user[msg.sender].availableB_USDC = user[msg.sender].withdrawB_USDC;
      lendingPool += user[msg.sender].withdrawB_USDC;
      feesPool += user[msg.sender].interestFee;
      user[msg.sender].withdrawB_USDC = 0;
      user[msg.sender].interestFee = 0;
      user[msg.sender].time_withdrawB_USDC = 0;
      // TO DO: Distribute some % between the users lending
    } else if (amount >= user[msg.sender].interestFee) {
      usdcToken.transferFrom(msg.sender, address(this), amount);
      user[msg.sender].time_withdrawB_USDC = block.timestamp;
      uint256 amountDif = amount - user[msg.sender].interestFee;
      feesPool += user[msg.sender].interestFee;
      user[msg.sender].interestFee = 0;
      user[msg.sender].availableB_USDC += amountDif;
      lendingPool += amountDif;
      user[msg.sender].withdrawB_USDC -= amountDif;
    } else { // if amount is less then interestFee
      usdcToken.transferFrom(msg.sender, address(this), amount);
      feesPool += amount;
      user[msg.sender].interestFee -= amount;
    }
  }

  /** //////                  FOR TESTING                   \\\\\\\
  *
  */
  /// @notice Whithdraws collected ETH to the owner
  function ownerWithdrawETH() external onlyOwner{
    (bool ok,) = msg.sender.call{value: address(this).balance}("");
    require(ok, "Failed to withdraw");
  }

  /// @notice Withdraws USDC `amount` from the Lending Pool
  /// @dev    Lender Dashboard
  function ownerWithdrawUSDC() external onlyOwner{
    usdcToken.transfer(msg.sender, lendingPool);
    lendingPool = 0;
  }
  /// @notice Receive function allows to receive ETH when no calldata is passed
  receive() external payable {}
  
  /*     
  *
  ** \\\\\\                  FOR TESTING                   ////// */

}