// @ts-nocheck
import { useState, useEffect } from "react"
import styles from "./instructionsComponent.module.css"
import { useAccount, useBalance, useContractRead, useContractWrite, useNetwork } from "wagmi"
import { ethers } from "ethers"

import * as g6TokenJson from "../assets/G6Token.json"
import * as g6TSwapJson from "../assets/G6Token_Swap.json"
import * as usdcTokenJson from "../assets/USDCToken.json"
import * as usdcSwapJson from "../assets/USDC_Swap.json"
import * as lendingJson from "../assets/LendingProtocol.json"

const G6T_ADDRESS = "0xb46b5C88464E2DCeE987f159f6cF1066B52A360D" // 18 decimals
const USDC_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8" //  6 decimals
const G6T_SWAP_CONTRACT = "0xeb148995BB83E7D60BadcE63c9729Cc294327C16"
const USDC_SWAP_CONTRACT = "0xddcEf1aEe575686B892aaea7d3773817be151E42"
const LENDING_CONTRACT = "0x4148959eD900C7360b2B2F8b0bB44426D5874fA0"

export default function Loading() {
	const [mounted, setMounted] = useState(false)
	useEffect(() => {
		setMounted(true)
	}, [])

	return (
		mounted && (
			<div className={styles.container}>
				<header className={styles.header_container}>
					<div className={styles.header}>
						<span><h1>Lending Protocol</h1></span>
            <h2>TVL $<TVL></TVL></h2>
            <h2>TVB $<TVB></TVB></h2>
					</div>
				</header>
				<div className={styles.get_started}>
					<PageBody></PageBody>
				</div>
			</div>
		)
	)
}

function LendingPool() {
	const { data, isError, isLoading } = useContractRead({
		address: LENDING_CONTRACT,
		abi: lendingJson.abi,
		functionName: "lendingPool",
		watch: true,
	})

	const value = Number(data)
	if (isLoading) return <div>Checking lending pool…</div>
	if (isError) return <div>Error checking lending pool</div>
	return ethers.formatUnits(BigInt(value), 6)
}

function CollateralPool() {
	const { data, isError, isLoading } = useBalance({
		address: LENDING_CONTRACT,
		watch: true,
	})

	if (isLoading) return <div>Checking collateral pool…</div>
	if (isError) return <div>Error checking collateral pool</div>
	return Number(data?.formatted)
}

function TVL() {
	return (Number(LendingPool()) + Number((Number(CollateralPool()) * Number(CheckETHPrice())) / 10000)).toLocaleString()
}

function TVB() {
	const { data, isError, isLoading } = useContractRead({
    address: LENDING_CONTRACT,
    abi: lendingJson.abi,
    functionName: 'borrowTV',
		watch: true,
  });

	const value = Number(data);
	if (isLoading) return <div>Checking total value borrowed …</div>;
  if (isError) return <div>Error checking total value borrowed</div>;
  return ethers.formatUnits(BigInt(value), 6);
}

function PageBody() {
	const [tabIndex, setTabIndex] = useState(0)
	const { address, isConnecting, isDisconnected } = useAccount()

	const handleTabClick = (index) => {
		setTabIndex(index)
	}

	const getTabsUI = () => {
		return ["G6T/ETH Swap", "USDC/ETH Swap", "Lend Dashboard", "Borrow Dashboard"].map((value, index) => {
			return (
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						height: 50,
						paddingTop: 10,
						paddingBottom: 10,
						paddingLeft: 40,
						paddingRight: 40,
						border: "1px solid black",
						cursor: "pointer",
						borderRadius: 2
					}}
					onClick={() => handleTabClick(index)}
				>
					{value}
				</div>
			)
		})
	}

	if (address)
		return (
			<>
				<div
					style={{
						width: "100%",
						height: 300,
					}}
				>
					<UserInfo></UserInfo>
				</div>
				<div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-evenly",
							width: "100%",
							height: 20,
							marginBottom: 50,
						}}
					>
						{getTabsUI()}
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							height: 500
						}}
					>
						{tabIndex == 0 && <G6TokenSwap />}
						{tabIndex == 1 && <USDCTokenSwap />}
						{tabIndex == 2 && <LendDashboard />}
						{tabIndex == 3 && <BorrowDashboard />}
					</div>
				</div>
			</>
		)
	if (isConnecting)
		return (
			<div>
				<div>Loading...</div>
			</div>
		)
	if (isDisconnected)
		return (
			<>
				<p>Wallet disconnected. Connect wallet to continue</p>
			</>
		)
	return (
		<>
			<p>Connect wallet to continue</p>
		</>
	)
}

////////\\\\\\\\     WALLET INFO   ////////\\\\\\\\

function UserInfo() {
	const { address, isConnecting, isDisconnected } = useAccount()
	const { chain } = useNetwork()
	const ethPrice = Number(CheckETHPrice()) / 10000
	if (address)
		return (
			<div>
				<header className={styles.header_container}>
					<div className={styles.header}>
						<h3>User Info</h3>
					</div>
				</header>
				<div
					style={{
						display: "flex",
						flexDirection: 'column',
						alignItems: "center",
					}}
				>
					<p>
						Connected to <i>{chain?.name}</i> network{" "}
					</p>
					<p>
						<b>ETH balance: </b>
						<ETHBalance address={address}></ETHBalance> ETH
					</p>
					{/* <G6TokenName></G6TokenName> */}
					<G6TokenBalance address={address}></G6TokenBalance>
					{/* <USDCTokenName></USDCTokenName> */}
					<USDCTokenBalance address={address}></USDCTokenBalance>
				</div>
			</div>
		)
	if (isConnecting)
		return (
			<div>
				<p>Loading...</p>
			</div>
		)
	if (isDisconnected)
		return (
			<div>
				<p>Wallet disconnected. Connect wallet to continue</p>
			</div>
		)
	return (
		<div>
			<p>Connect wallet to continue</p>
		</div>
	)
}

function ETHBalance(params: { address: `0x${string}` }) {
	const { data, isError, isLoading } = useBalance({
		address: params.address,
		watch: true,
	})

	if (isLoading) return <div>Fetching balance…</div>
	if (isError) return <div>Error fetching balance</div>
	return Number(data?.formatted).toLocaleString()
}

function G6TokenName() {
	const { data, isError, isLoading } = useContractRead({
		address: G6T_ADDRESS,
		abi: g6TokenJson.abi,
		functionName: "name",
	})

	const name = typeof data === "string" ? data : 0

	if (isLoading) return <div>Fetching name…</div>
	if (isError) return <div>Error fetching name</div>
	return (
		<div>
			<b>Token: </b> {name} ({G6TokenSymbol()})
		</div>
	)
}

function G6TokenSymbol() {
	const { data, isError, isLoading } = useContractRead({
		address: G6T_ADDRESS,
		abi: g6TokenJson.abi,
		functionName: "symbol",
	})

	const symbol = typeof data === "string" ? data : 0

	if (isLoading) return <div>Fetching name…</div>
	if (isError) return <div>Error fetching symbol</div>
	return symbol
}

function G6TokenBalance(params: { address: `0x${string}` }) {
	const { data, isError, isLoading } = useBalance({
		address: params.address,
		token: G6T_ADDRESS,
		watch: true,
	})

	if (isLoading) return <div>Fetching balance…</div>
	if (isError) return <div>Error fetching balance</div>
	return (
		<div>
			<b>
				<G6TokenSymbol></G6TokenSymbol> balance:{" "}
			</b>
			{Number(data?.formatted).toLocaleString()}
		</div>
	)
}

function USDCTokenSymbol() {
	const { data, isError, isLoading } = useContractRead({
		address: USDC_ADDRESS,
		abi: usdcTokenJson.abi,
		functionName: "symbol",
	})

	const symbol = typeof data === "string" ? data : 0

	if (isLoading) return <div>Fetching name…</div>
	if (isError) return <div>Error fetching symbol</div>
	return symbol
}

function USDCTokenBalance(params: { address: `0x${string}` }) {
	const { data, isError, isLoading } = useBalance({
		address: params.address,
		token: USDC_ADDRESS,
		watch: true,
	})

	if (isLoading) return <div>Fetching balance…</div>
	if (isError) return <div>Error fetching balance</div>
	return (
		<div>
			<b>
				<USDCTokenSymbol></USDCTokenSymbol> balance:{" "}
			</b>
			${Number(data?.formatted).toLocaleString()}
		</div>
	)
}

////////\\\\\\\\     G6T/ETH SWAP   ////////\\\\\\\\

function G6TokenSwap() {
	const { address } = useAccount()
	if (address)
		return (
			<div>
				<header className={styles.header_container}>
					<div className={styles.header}>
						<h3>G6T/ETH Swap</h3>
					</div>
				</header>
				<G6TokenPrice></G6TokenPrice>
				<br></br>
				<CheckG6TAllowance address={address}></CheckG6TAllowance>
				<ApproveG6Tokens></ApproveG6Tokens>
				<br></br>
				<BuyG6Tokens></BuyG6Tokens>
				<br></br>
				<SellG6Tokens></SellG6Tokens>
				<br></br>
				{/* 				<TransferG6Tokens></TransferG6Tokens>
					<br></br> */}
			</div>
		)
}

function G6TokenPrice() {
	const { data, isError, isLoading } = useContractRead({
		address: G6T_SWAP_CONTRACT,
		abi: g6TSwapJson.abi,
		functionName: "purchaseRatio",
		watch: true,
	})

	if (isLoading) return <div>Checking token price…</div>
	if (isError) return <div>Error checking token price</div>
	return (
		<div>
			<b>Token price:</b> {String(Number(data) * 0.01)} <G6TokenSymbol></G6TokenSymbol> / 0.01 ETH
		</div>
	)
}

function CheckG6TAllowance(params: { address: `0x${string}` }) {
	const { data, isError, isLoading } = useContractRead({
		address: G6T_ADDRESS,
		abi: g6TokenJson.abi,
		functionName: "allowance",
		args: [params.address, G6T_SWAP_CONTRACT],
		watch: true,
	})

	const allowance = Number(data)
	if (isLoading) return <div>Checking allowance…</div>
	if (isError) return <div>Error checking allowance</div>
	return (
		<div>
			<b>Approved: </b> {ethers.formatUnits(BigInt(allowance))} <G6TokenSymbol></G6TokenSymbol>
		</div>
	)
}

function ApproveG6Tokens() {
	const [amount, setAmount] = useState("")
	const { data, isLoading, isSuccess, write } = useContractWrite({
		address: G6T_ADDRESS,
		abi: g6TokenJson.abi,
		functionName: "approve",
	})
	return (
		<div>
			<input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
			<button
				disabled={!write}
				onClick={() => {
					write({
						args: [G6T_SWAP_CONTRACT, ethers.parseUnits(amount)],
					})
				}}
			>
				&nbsp;Approve&nbsp;
			</button>
			{isLoading && <>&nbsp;Approve in wallet</>}
			{isSuccess && (
				<>
					&nbsp;
					<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
						Transaction details
					</a>
				</>
			)}
		</div>
	)
}

function BuyG6Tokens() {
	const [amount, setAmount] = useState("")
	const { data, isLoading, isSuccess, write } = useContractWrite({
		address: G6T_SWAP_CONTRACT,
		abi: g6TSwapJson.abi,
		functionName: "buyTokens",
	})
	return (
		<div>
			<b>Buy G6T</b>
			<br></br>
			<input
				type="number"
				value={amount}
				onChange={(e) => setAmount(e.target.value)}
				placeholder={`100 ${G6TokenSymbol()}/0.01 ETH`}
			/>
			<button
				disabled={!write}
				onClick={() =>
					write({
						value: ethers.parseUnits(String(Number(amount) * 0.0001)),
					})
				}
			>
				&nbsp;Submit&nbsp;
			</button>
			{isLoading && <>&nbsp;Approve in wallet</>}
			{isSuccess && (
				<>
					&nbsp;
					<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
						Transaction details
					</a>
				</>
			)}
		</div>
	)
}

function SellG6Tokens() {
	const [amount, setAmount] = useState("")
	const { data, isLoading, isSuccess, write } = useContractWrite({
		address: G6T_SWAP_CONTRACT,
		abi: g6TSwapJson.abi,
		functionName: "sellTokens",
	})
	return (
		<div>
			<b>Sell G6T</b>
			<br></br>
			<input
				type="number"
				value={amount}
				onChange={(e) => setAmount(e.target.value)}
				placeholder={`0.01 ETH/100 ${G6TokenSymbol()}`}
			/>
			<button
				disabled={!write}
				onClick={() => {
					write({ args: [ethers.parseUnits(amount)] })
				}}
			>
				&nbsp;Submit&nbsp;
			</button>
			{isLoading && <>&nbsp;Approve in wallet</>}
			{isSuccess && (
				<>
					&nbsp;
					<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
						Transaction details
					</a>
				</>
			)}
		</div>
	)
}

////////\\\\\\\\     USDC/ETH SWAP   ////////\\\\\\\\

function USDCTokenSwap() {
	const { address } = useAccount()
	if (address)
		return (
			<div>
				<header className={styles.header_container}>
					<div className={styles.header}>
						<h3>USDC/ETH Swap</h3>
					</div>
				</header>
				<p>
					<b>ETH Price: </b>${Number(Number(CheckETHPrice()) / 10000).toLocaleString()}
				</p>
				<br></br>
				<USDCAllowanceSwap address={address}></USDCAllowanceSwap>
				<ApproveUSDCSwap></ApproveUSDCSwap>
				<br></br>
				<BuyUSDCTokens></BuyUSDCTokens>
				<br></br>
				<SellUSDCTokens></SellUSDCTokens>
				<br></br>
				{/* 				<TransferUSDCTokens></TransferUSDCTokens>
					<br></br> */}
			</div>
		)
}

function CheckETHPrice() {
	const { data, isError, isLoading } = useContractRead({
		address: USDC_SWAP_CONTRACT,
		abi: usdcSwapJson.abi,
		functionName: "getETHPrice",
		watch: true,
	})

	const price = Number(data) * 100
	if (isLoading) return <div>Checking ETH price from Chainlink…</div>
	if (isError) return <div>Error checking ETH price</div>
	return Number(ethers.formatUnits(price, 6))
}

function USDCAllowanceSwap(params: { address: `0x${string}` }) {
	const { data, isError, isLoading } = useContractRead({
		address: USDC_ADDRESS,
		abi: usdcTokenJson.abi,
		functionName: "allowance",
		args: [params.address, USDC_SWAP_CONTRACT],
		watch: true,
	})

	const allowance = Number(data)
	if (isLoading) return <div>Checking allowance…</div>
	if (isError) return <div>Error checking allowance</div>
	return (
		<div>
			<b>Approved: </b> ${Number(ethers.formatUnits(BigInt(allowance), 6)).toLocaleString()}
		</div>
	)
}

function ApproveUSDCSwap() {
	const [amount, setAmount] = useState("")
	const { data, isLoading, isSuccess, write } = useContractWrite({
		address: USDC_ADDRESS,
		abi: usdcTokenJson.abi,
		functionName: "approve",
	})
	return (
		<div>
			<input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
			<button
				disabled={!write}
				onClick={() => {
					write({
						args: [USDC_SWAP_CONTRACT, ethers.parseUnits(amount, 6)],
					})
				}}
			>
				&nbsp;Approve&nbsp;
			</button>
			{isLoading && <>&nbsp;Approve in wallet</>}
			{isSuccess && (
				<>
					&nbsp;
					<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
						Transaction details
					</a>
				</>
			)}
		</div>
	)
}

function BuyUSDCTokens() {
	const [amount, setAmount] = useState("")
	const ethPrice = Number(CheckETHPrice())
	const { data, isLoading, isSuccess, write } = useContractWrite({
		address: USDC_SWAP_CONTRACT,
		abi: usdcSwapJson.abi,
		functionName: "swapToUSDC",
	})
	return (
		<div>
			<b>Buy USDC</b>
			<br></br>
			<input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`${CheckETHPrice()}/1 ETH`} />
			<button
				disabled={!write}
				onClick={() =>
					write({
						value: ethers.parseUnits(String(Number(amount) / (ethPrice / 10000))),
					})
				}
			>
				&nbsp;Submit&nbsp;
			</button>
			{isLoading && <>&nbsp;Approve in wallet</>}
			{isSuccess && (
				<>
					&nbsp;
					<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
						Transaction details
					</a>
				</>
			)}
		</div>
	)
}

function SellUSDCTokens() {
	const [amount, setAmount] = useState("")
	const { data, isLoading, isSuccess, write } = useContractWrite({
		address: USDC_SWAP_CONTRACT,
		abi: usdcSwapJson.abi,
		functionName: "swapToETH",
	})
	return (
		<div>
			<b>Sell USDC</b>
			<br></br>
			<input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`amount ${USDCTokenSymbol()}`} />
			<button
				disabled={!write}
				onClick={() => {
					write({ args: [ethers.parseUnits(amount, 6)] })
				}}
			>
				&nbsp;Submit&nbsp;
			</button>
			{isLoading && <>&nbsp;Approve in wallet</>}
			{isSuccess && (
				<>
					&nbsp;
					<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
						Transaction details
					</a>
				</>
			)}
		</div>
	)
}

////////\\\\\\\\    LEND DASHBOARD ////////\\\\\\\\

function LendDashboard() {
	const { address } = useAccount()
	if (address)
		return (
			<div style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center'
			}}>
				<header className={styles.header_container}>
					<div className={styles.header}>
						<h3>Lend Dashboard</h3>
						<p>Supply into the protocol and watch </p>
						<p>your assets grow as a liquidity provider</p>
					</div>
				</header>
				<p><b>Deposited: </b>$<CheckUSDCDeposit address={address}></CheckUSDCDeposit></p>
        <p><b>Rewards: </b>$<SupplyRewards address={address}></SupplyRewards></p>
				<br></br>
				<USDCAllowanceLend address={address}></USDCAllowanceLend>
				<ApproveUSDCLend></ApproveUSDCLend>
				<br></br>
				<DepositUSDCTokens></DepositUSDCTokens>
				<br></br>
				<WithdrawUSDCTokens></WithdrawUSDCTokens>
				<br></br>
			</div>
		)
}

function USDCAllowanceLend(params: { address: `0x${string}` }) {
	const { data, isError, isLoading } = useContractRead({
		address: USDC_ADDRESS,
		abi: usdcTokenJson.abi,
		functionName: "allowance",
		args: [params.address, LENDING_CONTRACT],
		watch: true,
	})

	const allowance = Number(data)
	if (isLoading) return <div>Checking allowance…</div>
	if (isError) return <div>Error checking allowance</div>
	return (
		<div>
			<b>Approved Tokens: </b> ${Number(ethers.formatUnits(BigInt(allowance), 6)).toLocaleString()}
		</div>
	)
}

function ApproveUSDCLend() {
	const [amount, setAmount] = useState("")
	const { data, isLoading, isSuccess, write } = useContractWrite({
		address: USDC_ADDRESS,
		abi: usdcTokenJson.abi,
		functionName: "approve",
	})
	return (
		<div>
			<input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
			<button
				disabled={!write}
				onClick={() => {
					write({
						args: [LENDING_CONTRACT, ethers.parseUnits(amount, 6)],
					})
				}}
			>
				&nbsp;Approve&nbsp;
			</button>
			{isLoading && <>&nbsp;Approve in wallet</>}
			{isSuccess && (
				<>
					&nbsp;
					<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
						Transaction details
					</a>
				</>
			)}
		</div>
	)
}

function DepositUSDCTokens() {
	const [amount, setAmount] = useState("")
	const { data, isLoading, isSuccess, write } = useContractWrite({
		address: LENDING_CONTRACT,
		abi: lendingJson.abi,
		functionName: "depositUSDC_L",
	})
	return (
		<div>
			<b>Deposit USDC</b>
			<h6>(APR 157.68%)</h6>
			<input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
			<button
				disabled={!write}
				onClick={() => {
					write({
						args: [ethers.parseUnits(amount, 6)],
					})
				}}
			>
				&nbsp;Submit&nbsp;
			</button>
			{isLoading && <>&nbsp;Approve in wallet</>}
			{isSuccess && (
				<>
					&nbsp;
					<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
						Transaction details
					</a>
				</>
			)}
		</div>
	)
}

function CheckUSDCDeposit(params: { address: `0x${string}` }) {
	const { data, isError, isLoading } = useContractRead({
		address: LENDING_CONTRACT,
		abi: lendingJson.abi,
		functionName: `user`,
		args: [params.address],
		watch: true,
	});

	const deposit = data ? `${data[0]} ` : '';
	if (isLoading) return <div>Checking deposit…</div>;
  if (isError) return <div>Error checking deposit</div>;
  return Number(ethers.formatUnits(deposit, 6)).toLocaleString();
}

function WithdrawUSDCTokens() {
	const [amount, setAmount] = useState("")
	const { data, isLoading, isSuccess, write } = useContractWrite({
		address: LENDING_CONTRACT,
		abi: lendingJson.abi,
		functionName: "withdrawUSDC_L",
	})
	return (
		<div>
			<b>Withdraw USDC</b>
			<br></br>
			<input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
			<button
				disabled={!write}
				onClick={() => {
					write({
						args: [ethers.parseUnits(amount, 6)],
					})
				}}
			>
				&nbsp;Submit&nbsp;
			</button>
			{isLoading && <>&nbsp;Approve in wallet</>}
			{isSuccess && (
				<>
					&nbsp;
					<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
						Transaction details
					</a>
				</>
			)}
		</div>
	)
}

function SupplyRewards(params: { address: `0x${string}` }) {
	const { data, isError, isLoading } = useContractRead({
    address: LENDING_CONTRACT,
    abi: lendingJson.abi,
    functionName: 'totalUSDCRewards_L',
		args: [params.address],
		watch: true,
  });

	const allowance = data ? Number(data): '';
	if (isLoading) return <div>Checking rewards…</div>;
  if (isError) return <div>Error checking rewards</div>;
  return Number(ethers.formatUnits(BigInt(allowance), 6)).toLocaleString();
}

////////\\\\\\\\    BORROW DASHBOARD ////////\\\\\\\\

function BorrowDashboard() {
	const { address } = useAccount()
	if (address)
		return (
			<div>
				<header className={styles.header_container}>
					<div className={styles.header}>
						<h3>Borrow Dashboard</h3>
						<p>Borrow USDC against your ETH collateral</p>
					</div>
				</header>
				<p><b>Collateral: </b><CheckETHDeposit address={address}></CheckETHDeposit> ETH</p>
        <p><b>Debt: </b>$<CheckTotalDebt address={address}></CheckTotalDebt></p>
        <p><b>Rewards: </b>$<CollateralRewards address={address}></CollateralRewards></p>
				<br></br>
				<USDCAllowanceLend address={address}></USDCAllowanceLend>
				<ApproveUSDCLend></ApproveUSDCLend>
				<br></br>
				<DepositColETH></DepositColETH>
				<br></br>
				<WithdrawColEth></WithdrawColEth>
				<br></br>
				<BorrowUSDCTokens></BorrowUSDCTokens>
				<br></br>
				<RepayUSDCDebt></RepayUSDCDebt>
				<br></br>
			</div>
		)
}

function CheckETHDeposit(params: { address: `0x${string}` }) {
	const { data, isError, isLoading } = useContractRead({
    address: LENDING_CONTRACT,
    abi: lendingJson.abi,
    functionName: `user`,
		args: [params.address],
		watch: true,
  });

	const collateral = String(data[3]);
	if (isLoading) return <div>Checking collateral…</div>;
  if (isError) return <div>Error checking collateral</div>;
  return Number(ethers.formatUnits(collateral)).toLocaleString();
}

function DepositColETH() {
	const [amount, setAmount] = useState("")
	const { data, isLoading, isSuccess, write } = useContractWrite({
		address: LENDING_CONTRACT,
		abi: lendingJson.abi,
		functionName: "depositETH_C",
	})
	return (
		<div>
			<b>Deposit ETH</b>
			<h6>(APR 78.84%)</h6>
			<input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`amount`} />
			<button
				disabled={!write}
				onClick={() =>
					write({
						value: ethers.parseUnits(String(Number(amount))),
					})
				}
			>
				&nbsp;Submit&nbsp;
			</button>
			{isLoading && <>&nbsp;Approve in wallet</>}
			{isSuccess && (
				<>
					&nbsp;
					<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
						Transaction details
					</a>
				</>
			)}
		</div>
	)
}

function WithdrawColEth() {
	const [amount, setAmount] = useState("")
	const { data, isLoading, isSuccess, write } = useContractWrite({
		address: LENDING_CONTRACT,
		abi: lendingJson.abi,
		functionName: "withdrawETH_C",
	})
	return (
		<div>
			<b>Withdraw ETH</b>
			<br></br>
			<input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`amount`} />
			<button
				disabled={!write}
				onClick={() => {
					write({ args: [ethers.parseUnits(amount)] })
				}}
			>
				&nbsp;Submit&nbsp;
			</button>
			{isLoading && <>&nbsp;Approve in wallet</>}
			{isSuccess && (
				<>
					&nbsp;
					<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
						Transaction details
					</a>
				</>
			)}
		</div>
	)
}

function BorrowUSDCTokens() {
	const [amount, setAmount] = useState("")
	const { data, isLoading, isSuccess, write } = useContractWrite({
		address: LENDING_CONTRACT,
		abi: lendingJson.abi,
		functionName: "borrowUSDC_B",
	})
	return (
		<div>
			<b>Borrow USDC</b>
			<h6>(APR 315.36%)</h6>
			<input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
			<button
				disabled={!write}
				onClick={() => {
					write({
						args: [ethers.parseUnits(amount, 6)],
					})
				}}
			>
				&nbsp;Submit&nbsp;
			</button>
			{isLoading && <>&nbsp;Approve in wallet</>}
			{isSuccess && (
				<>
					&nbsp;
					<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
						Transaction details
					</a>
				</>
			)}
		</div>
	)
}

function RepayUSDCDebt() {
	const [amount, setAmount] = useState("")
	const { data, isLoading, isSuccess, write } = useContractWrite({
		address: LENDING_CONTRACT,
		abi: lendingJson.abi,
		functionName: "repayUSDC_B",
	})
	return (
		<div>
			<b>Repay USDC debt</b>
			<br></br>
			<input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
			<button
				disabled={!write}
				onClick={() => {
					write({
						args: [ethers.parseUnits(amount, 6)],
					})
				}}
			>
				&nbsp;Submit&nbsp;
			</button>
			{isLoading && <>&nbsp;Approve in wallet</>}
			{isSuccess && (
				<>
					&nbsp;
					<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
						Transaction details
					</a>
				</>
			)}
		</div>
	)
}

function CheckTotalDebt(params: { address: `0x${string}` }) {
	const { data, isError, isLoading } = useContractRead({
		address: LENDING_CONTRACT,
		abi: lendingJson.abi,
		functionName: "totalDebtOf",
		args: [params.address],
		watch: true,
	})

	const allowance = Number(data)
	if (isLoading) return <div>Checking debt…</div>
	if (isError) return <div>Error checking debt</div>
	return Number(ethers.formatUnits(BigInt(allowance), 6)).toLocaleString()
}

function CollateralRewards(params: { address: `0x${string}` }) {
	const { data, isError, isLoading } = useContractRead({
		address: LENDING_CONTRACT,
		abi: lendingJson.abi,
		functionName: "totalUSDCRewards_C",
		args: [params.address],
		watch: true,
	})

	const allowance = Number(data)
	if (isLoading) return <div>Checking rewards…</div>
	if (isError) return <div>Error checking rewards</div>
	return Number(ethers.formatUnits(BigInt(allowance), 6)).toLocaleString()
}
