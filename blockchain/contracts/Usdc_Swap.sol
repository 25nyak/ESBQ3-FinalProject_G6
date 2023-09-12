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

/// @title A very simple lottery contract
/// @author josevazf
/// @notice You can use this contract for running a very simple lottery
contract USDC_Swap is Ownable {
    /// @notice Address of the oracle contract ETH/USD from Chainlink feed
    CallOracle public oracleContract;
    /// @notice Address of the USDC token contract from Aave
    IERC20 public usdcToken;
    /// @notice Amount of USDC tokens in the pool
    uint256 public usdcPool;

    /// @notice Constructor function
    constructor() {
        oracleContract = CallOracle(0xD17ecb6579cAD73aE27596929e13b619bA9060A5);
        usdcToken = IERC20(0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8);
    }

    /// @notice Get USDC balance in the contract
    function getUSDCBalance(address account) public view returns (uint256) {
        return usdcToken.balanceOf(account);
    }

    /// @notice Get ETH balance in the contract
    function getETHBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Get ETH/USD price from the Oracle feed
    function getETHPrice() public view returns (int256) {
        return oracleContract.getEthUsdPrice();
    }

    /// @notice Charges the bet price and creates a new bet slot with the sender's address
    function depositUSDC(uint256 amount) public {
        usdcPool += amount;
        usdcToken.transferFrom(msg.sender, address(this), amount);
    }

    /// @notice Gives tokens based on the amount of ETH sent and the price received from the Oracle
    /// @dev This implementation is prone to rounding problems
    function swapToUSDC() external payable {
        uint256 price = uint256(getETHPrice()) / 100;
        uint256 usdcAmount = (msg.value * price)/(1 ether);
        usdcPool -= usdcAmount;
        usdcToken.transfer(msg.sender, usdcAmount);
    }

    /// @notice Withdraws `amount` of USDC to the owner
    function ownerWithdrawUSDC(uint256 amount) external onlyOwner {
        require(amount <= usdcPool, "Amount not available to withdraw");
        usdcPool -= amount;
        usdcToken.transfer(msg.sender, amount);
    }

    /// @notice Whithdraws collected ETH to the owner
    function ownerWithdrawETH() public onlyOwner{
        (bool ok,) = msg.sender.call{value: address(this).balance}("");
        require(ok, "Failed to withdraw");
    }
}