// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {G6Token} from "./G6Token.sol";

/// @title A very simple lottery contract
/// @author josevazf
/// @notice You can use this contract for running a very simple lottery
/// @dev This contract implements a relatively weak randomness source, since there is no cliff period between the randao reveal and the actual usage in this contract
/// @custom:teaching This is a contract meant for teaching only
contract LendingPlatform is Ownable {
    /// @notice Address of the token used to distribute rewards to lenders
    G6Token public paymentToken;
    /// @notice Amount of tokens given per ETH paid
    uint256 public purchaseRatio;
    /// @notice Amount of tokens in the prize pool
    uint256 public prizePool;
    /// @notice Amount of tokens in the owner pool
    uint256 public ownerPool;
    /// @notice Mapping of prize available for withdraw for each account
    mapping(address => uint256) public prize;

    /// @notice Constructor function
    /// @param tokenName Name of the token used for payment
    /// @param tokenSymbol Symbol of the token used for payment
    /// @param _purchaseRatio Amount of tokens given per ETH paid
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 _purchaseRatio
    ) {
        paymentToken = new G6Token(tokenName, tokenSymbol);
        purchaseRatio = _purchaseRatio;
    }

    /// @notice Gives tokens based on the amount of ETH sent
    /// @dev This implementation is prone to rounding problems
    function purchaseTokens() external payable {
        paymentToken.mint(msg.sender, msg.value * purchaseRatio);
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