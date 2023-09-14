// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {G6Token} from "./G6Token.sol";

/// @title Swap contract for Group 6 Tokens
/// @author josevazf
/// @notice This is the contract to deal with the G6 Token Swaps
contract G6Token_Swap is Ownable {
  /// @notice Address of the token used to distribute rewards to lenders
  G6Token public g6Token;
  /// @notice Amount of tokens given per ETH paid
  uint256 public purchaseRatio;

  /// @notice Constructor function
  constructor() {
    g6Token = G6Token(0xb46b5C88464E2DCeE987f159f6cF1066B52A360D);
    purchaseRatio = 10000;
  }

  /// @notice Gives tokens based on the amount of ETH sent
  /// @dev This implementation is prone to rounding problems
  function buyTokens() external payable {
    g6Token.mint(msg.sender, msg.value * purchaseRatio);
  }

  /// @notice Burns `amount` tokens and give the equivalent ETH back to user
  function sellTokens(uint256 amount) external {
    g6Token.burnFrom(msg.sender, amount);
    payable(msg.sender).transfer(amount / purchaseRatio);
  }

  /// @notice Whithdraws collected ETH to the owner
  function withdraw() public onlyOwner{
    (bool ok,) = msg.sender.call{value: address(this).balance}("");
    require(ok, "Failed to withdraw");
  }
}