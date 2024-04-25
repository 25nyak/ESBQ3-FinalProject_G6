// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract CallOracle {
    AggregatorV3Interface internal dataFeed;

    /**
     * Network: Polygon (Matic)
     * Aggregator: ETH/USD
     * Address: <Polygon Aggregator Address>
     */
    constructor() {
        dataFeed = AggregatorV3Interface(
            // Replace the address with the Polygon aggregator address for ETH/USD
            0xF9680D99D6C9589e2a93a78A04A279e509205945
        );
    }

    /**
     * Returns the latest answer.
     */
    function getEthUsdPrice() public view returns (int256) {
        // prettier-ignore
        (
            /* uint80 roundID */,
            int256 answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }
}
