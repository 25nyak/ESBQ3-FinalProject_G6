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
/// @notice You can use this contract for running a very simple lottery
/// @dev This contract implements a relatively weak randomness source, since there is no cliff period between the randao reveal and the actual usage in this contract
/// @custom:poc This is a contract meant to be a proof of concept
contract LendingPlatform is Ownable {

    /// @notice Address of the oracle contract ETH/USD from Chainlink feed
    CallOracle public oracleContract;
    /// @notice Address of the USDC token contract from Aave
    IERC20 public usdcToken;
    /// @notice Address of the G6T token used to distribute rewards to users
    G6Token public g6Token;

    /// @notice Struct to keep track of each user's stats
    struct UserInfo {
        uint256 depositL_USDC;          // USDC deposited (Lending)
        uint256 time_depositL_USDC;     // Time of USDC deposit (Lending)
        uint256 reward_deposit;         // Rewards from deposit
        uint256 depositC_ETH;           // ETH deposited (Collateral)
        uint256 time_depositC_ETH;      // Time of ETH deposit (Collateral)
        uint256 availableB_USDC;        // Available USDC to borrow (Borrowing)
        uint256 withdrawB_USDC;         // USDC withdrawn (Borrowing)
        uint256 time_withdrawB_USDC;    // Time of USDC withdraw (Borrowing)
    }

    /// @notice Mapping of each user's address to it's corresponding struct element
    mapping (address => UserInfo) public user;
    /// @notice Amount of tokens in the Lending Pool
    uint256 public lendingPool;
    /// @notice Amount of tokens in the Fees Pool
    uint256 public feesPool;
    /// @notice Flag indicating whether the lottery is open for bets or not
    bool public betsOpen;
    /// @notice Timestamp of the lottery next closing date and time
    uint256 public betsClosingTime;

    /// @notice Constructor function
    constructor() {
        g6Token = G6Token(0xba64c03e45cc1E3Fe483dBDB3A671DBa7a0Ab7cD);
        oracleContract = CallOracle(0xD17ecb6579cAD73aE27596929e13b619bA9060A5);
        usdcToken = IERC20(0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8);
    }

    /// @notice Deposits USDC `amount` to the Lending Pool
    function depositUSDC(uint256 amount) external {
        usdcToken.transferFrom(msg.sender, address(this), amount);
        user(msg.sender).depositL_USDC += amount;
        user(msg.sender).time_depositL_USDC = block.timestamp;
        lendingPool += amount;
    }

    /// @notice Withdraws USDC `amount` from the Lending Pool
    function withdrawUSDC(uint256 amount) external {
        require(amount <= user(msg.sender).depositL_USDC, "Can't withdraw more than what you deposited");
        user(msg.sender).depositL_USDC -= amount;
        lendingPool -= amount;
        usdcToken.transfer(msg.sender, amount);
    }

    /// @notice Deposits ETH tokens as Collateral and sets borrowing limit to 80% of ETH value in USDC
    /// @dev This implementation is prone to rounding problems
    function depositETH() external payable {
        uint256 ethPrice = uint256(oracleContract.getEthUsdPrice()) / 100;
        uint256 usdcValue = (msg.value * ethPrice)/(1 ether);
        user(msg.sender).depositC_ETH += msg.value;
        user(msg.sender).availableB_USDC += (usdcValue * 8) / 10;
    }

    /// @notice Borrow USDC `amount` from the Lending Pool
    function borrowUSDC(uint256 amount) external {
        require(amount <= user(msg.sender).availableB_USDC, "Can't withdraw more than allowed");
        user(msg.sender).depositL_USDC -= amount;
        lendingPool -= amount;
        usdcToken.transfer(msg.sender, amount);
    }

/*     /// @notice Passes when the lottery is at closed state
    modifier whenBetsClosed() {
        require(!betsOpen, "Lottery is open");
        _;
    }

    /// @notice Passes when the lottery is at open state and the current block timestamp is lower than the lottery closing date
    modifier whenBetsOpen() {
        require(
            betsOpen && block.timestamp < betsClosingTime,
            "Lottery is closed"
        );
        _;
    }

    /// @notice Opens the lottery for receiving bets
    function openBets(uint256 closingTime) external onlyOwner whenBetsClosed {
        require(
            closingTime > block.timestamp,
            "Closing time must be in the future"
        );
        betsClosingTime = closingTime;
        betsOpen = true;
    } */

    /// @notice Closes the lottery and calculates the prize, if any
    /// @dev Anyone can call this function at any time after the closing time
    function closeLottery() external {
        require(block.timestamp >= betsClosingTime, "Too soon to close");
        require(betsOpen, "Already closed");
        if (_slots.length > 0) {
            uint256 winnerIndex = getRandomNumber() % _slots.length;
            address winner = _slots[winnerIndex];
            prize[winner] += prizePool;
            prizePool = 0;
            delete (_slots);
        }
        betsOpen = false;
    }

    /// @notice Returns a random number calculated from the previous block randao
    /// @dev This only works after The Merge
    function getRandomNumber() public view returns (uint256 randomNumber) {
        randomNumber = block.difficulty;
    }

    /// @notice Withdraws `amount` from that accounts's prize pool
    function prizeWithdraw(uint256 amount) external {
        require(amount <= prize[msg.sender], "Not enough prize");
        prize[msg.sender] -= amount;
        paymentToken.transfer(msg.sender, amount);
    }

    /// @notice Withdraws `amount` from the owner's pool
    function ownerWithdraw(uint256 amount) external onlyOwner {
        require(amount <= ownerPool, "Not enough fees collected");
        ownerPool -= amount;
        paymentToken.transfer(msg.sender, amount);
    }

    /// @notice Burns `amount` tokens and give the equivalent ETH back to user
    function returnTokens(uint256 amount) external {
        paymentToken.burnFrom(msg.sender, amount);
        payable(msg.sender).transfer(amount / purchaseRatio);
    }
}