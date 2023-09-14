
# Encode Solidity Bootcamp Q3 - Final Project 
## Group 6 Lending Protocol

Decentralized Lending application that enables supplying of ETH as collateral in order to borrow USDC. Accounts can also earn interest by supplying USDC to the protocol.

https://esbq3-group6-lending.netlify.app/

- **G6T Token contract**: 0xdCf3F6153F328A7Aacd7C688Bf39E8750a375746
- **USDC Token contract**: 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8
- **ETH/USD Oracle contract**: 0xD17ecb6579cAD73aE27596929e13b619bA9060A5
- **G6T Swap contract**: 0xdfAf15C7D809027571784F3Dd3F2e1cd7263A229
- **USDC Swap contract**: 0xddcEf1aEe575686B892aaea7d3773817be151E42
- **Lending Protocol contract**: 0x9dD25B7ed4a0ddfB15EaA97f361d04729a58c368

The Lending dApp operates under three tokens: native Sepolia ETH, USDC and our very own G6T.

On the Lend side users can make their USDC available to other users looking for a loan by depositing into the Liquidity Pool. As an incentive Lenders receive G6T token rewards under a set APR rate while also sharing a part of the protocol fees payed by the Borrowers.

On the Borrow side users can deposit ETH as collateral and borrow up to 80% of the corresponding value in USDC. Once this happens interest fees start accruing until the total debt is repayed or until the debt value surpasses the value of the deposited collateral, by wich they are liquidated, losing the deposited ETH. 

To facilitate interactions with the protocol there are also two interfaces to swap between ETH/G6T and ETH/USDC, provided by the protocol.

The application was implemented using React/Next.js and Wagmi hooks to interact with the smart contracts.

## Setup:
1. Clone the repository.
2. Install dependencies with `npm install` within `frontend` folder.
3. Update variables with your contracts addresses inside `/frontend/components/instructionsComponent/index.tsx`
4. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000) with your browser to interact with the dApp.
