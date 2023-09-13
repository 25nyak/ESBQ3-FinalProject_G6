import { useState, useEffect } from 'react';
import styles from './instructionsComponent.module.css';
import { useAccount, useBalance, useContractRead, useContractWrite, useNetwork, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { ethers} from 'ethers';
import * as g6TokenJson from '../assets/G6Token.json';
import * as g6TSwapJson from '../assets/G6Token_Swap.json';
import * as usdcTokenJson from '../assets/USDCToken.json';
import * as usdcSwapJson from '../assets/USDC_Swap.json';
import Footer from "@/components/instructionsComponent/navigation/footer";

const G6T_ADDRESS = '0x1D6557e0a71Eee3A5cF54CC2617E194264619c0A';   // 18 decimals
const USDC_ADDRESS = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8'   //  6 decimals
const ORACLE_ETH_USD = '0xD17ecb6579cAD73aE27596929e13b619bA9060A5' //  8 decimals
const G6T_SWAP_CONTRACT = '0xdfAf15C7D809027571784F3Dd3F2e1cd7263A229'
const USDC_SWAP_CONTRACT = '0xddcEf1aEe575686B892aaea7d3773817be151E42'
const LENDING_PLAT_CONTRACT = '0x9dD25B7ed4a0ddfB15EaA97f361d04729a58c368'

export default function Loading() {
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true)
	}, [])

  return (
		mounted &&
			<div className={styles.container}>
				<header className={styles.header_container}>
					<div className={styles.header}>
						<span><h2>G6 Lending Protocol</h2></span>
					</div>
				</header>
					<p className={styles.get_started}>
						<PageBody></PageBody>
					</p>
			</div>
  );
}

function PageBody() {
	const {address, isConnecting, isDisconnected } = useAccount();
	if (address)
		return (
			<div>
				<UserInfo></UserInfo>
				<hr></hr>
        <G6TokenSwap></G6TokenSwap>
        <hr></hr>
        <USDCTokenSwap></USDCTokenSwap>
        <hr></hr>
        <LendDashboard></LendDashboard>
        <hr></hr>
        <BorrowDashboard></BorrowDashboard>
        <hr></hr>
        <Footer />
			</div>
		);
		if (isConnecting)
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  if (isDisconnected)
    return (
      <div>
        <p>Wallet disconnected. Connect wallet to continue</p>
      </div>
    );
  return (
    <div>
      <p>Connect wallet to continue</p>
    </div>
  );
}

////////\\\\\\\\     WALLET INFO   ////////\\\\\\\\

function UserInfo() {
	const {address, isConnecting, isDisconnected } = useAccount();
	const { chain } = useNetwork();
  const ethPrice = Number(CheckETHPrice()) / 10000;
	if (address)
    return (
      <div>
				<header className={styles.header_container}>
					<div className={styles.header}>
						<h3>User Info</h3>
					</div>
				</header>
					<p>Connected to <i>{chain?.name}</i> network </p>
          <p><b>ETH Price: </b>{Number(CheckETHPrice()) / 10000} <USDCTokenSymbol></USDCTokenSymbol></p>
					{/* <G6TokenName></G6TokenName> */}
					<G6TokenBalance address={address}></G6TokenBalance>
          {/* <USDCTokenName></USDCTokenName> */}
					<USDCTokenBalance address={address}></USDCTokenBalance>
      </div>
    );
  if (isConnecting)
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  if (isDisconnected)
    return (
      <div>
        <p>Wallet disconnected. Connect wallet to continue</p>
      </div>
    );
  return (
    <div>
      <p>Connect wallet to continue</p>
    </div>
  );
}

function G6TokenName() {
  const { data, isError, isLoading } = useContractRead({
    address: G6T_ADDRESS,
    abi: g6TokenJson.abi,
    functionName: "name",
  });

  const name = typeof data === "string" ? data : 0;

  if (isLoading) return <div>Fetching name…</div>;
  if (isError) return <div>Error fetching name</div>;
  return <div><b>Token: </b> {name} ({G6TokenSymbol()})</div>;
}

function G6TokenSymbol() {
  const { data, isError, isLoading } = useContractRead({
    address: G6T_ADDRESS,
    abi: g6TokenJson.abi,
    functionName: 'symbol',
  });

  const symbol = typeof data === 'string' ? data : 0;

  if (isLoading) return <div>Fetching name…</div>;
  if (isError) return <div>Error fetching symbol</div>;
  return symbol;
}

function G6TokenBalance(params: { address: `0x${string}` }) {
  const { data, isError, isLoading } = useBalance({
    address: params.address,
		token: G6T_ADDRESS,
		watch: true
  });

  if (isLoading) return <div>Fetching balance…</div>;
  if (isError) return <div>Error fetching balance</div>;
  return <div><b><G6TokenSymbol></G6TokenSymbol> balance: </b>{data?.formatted}</div>;
}

function USDCTokenName() {
  const { data, isError, isLoading } = useContractRead({
    address: USDC_ADDRESS,
    abi: usdcTokenJson.abi,
    functionName: "name",
  });

  const name = typeof data === "string" ? data : 0;

  if (isLoading) return <div>Fetching name…</div>;
  if (isError) return <div>Error fetching name</div>;
  return <div><b>Token: </b> {name} ({USDCTokenSymbol()})</div>;
}

function USDCTokenSymbol() {
  const { data, isError, isLoading } = useContractRead({
    address: USDC_ADDRESS,
    abi: usdcTokenJson.abi,
    functionName: 'symbol',
  });

  const symbol = typeof data === 'string' ? data : 0;

  if (isLoading) return <div>Fetching name…</div>;
  if (isError) return <div>Error fetching symbol</div>;
  return symbol;
}

function USDCTokenBalance(params: { address: `0x${string}` }) {
  const { data, isError, isLoading } = useBalance({
    address: params.address,
		token: USDC_ADDRESS,
		watch: true
  });

  if (isLoading) return <div>Fetching balance…</div>;
  if (isError) return <div>Error fetching balance</div>;
  return <div><b><USDCTokenSymbol></USDCTokenSymbol> balance: </b>{data?.formatted}</div>;
}

////////\\\\\\\\     G6T SWAP   ////////\\\\\\\\

function G6TokenSwap() {
	const {address} = useAccount();
	if (address)
	return (
		<div>
			<header className={styles.header_container}>
				<div className={styles.header}>
					<h3>G6T Swap</h3>
				</div>
			</header>
        <G6TokenPrice></G6TokenPrice>
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
	);
}

function G6TokenPrice() {
	const { data, isError, isLoading } = useContractRead({
    address: G6T_SWAP_CONTRACT,
    abi: g6TSwapJson.abi,
    functionName: 'purchaseRatio',
		watch: true
  });

	if (isLoading) return <div>Checking token price…</div>;
  if (isError) return <div>Error checking token price</div>;
  return <div><b>Token price:</b> {String((Number(data) * 0.01))} <G6TokenSymbol></G6TokenSymbol> / 0.01 ETH</div>;
}

function CheckG6TAllowance(params: { address: `0x${string}` }) {
	const { data, isError, isLoading } = useContractRead({
    address: G6T_ADDRESS,
    abi: g6TokenJson.abi,
    functionName: 'allowance',
		args: [params.address, G6T_SWAP_CONTRACT],
		watch: true,
  });

	const allowance = Number(data);
	if (isLoading) return <div>Checking allowance…</div>;
  if (isError) return <div>Error checking allowance</div>;
  return <div><b>Approved Tokens: </b> {ethers.formatUnits(BigInt(allowance))} <G6TokenSymbol></G6TokenSymbol></div>;
}

function ApproveG6Tokens()	{
	const [amount, setAmount] = useState("");
	const { data, isLoading, isSuccess, write } = useContractWrite({
    address: G6T_ADDRESS,
    abi: g6TokenJson.abi,
    functionName: 'approve',
  })
		return (
			<div>
				<input
					type='number'
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					placeholder="Amount"
					/>
				<button
					disabled={!write}
					onClick={() => {
						write ({
							args: [G6T_SWAP_CONTRACT, ethers.parseUnits(amount)],
						})
					}}
				>
					&nbsp;Approve&nbsp;
				</button>
				{isLoading && <>&nbsp;Approve in wallet</>}
				{isSuccess && <>&nbsp; 
					<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
						Transaction details
					</a></>}
			</div>
		);
}

function BuyG6Tokens() {
	const [amount, setAmount] = useState("");
	const { data, isLoading, isSuccess, write } = useContractWrite({
    address: G6T_SWAP_CONTRACT,
    abi: g6TSwapJson.abi,
    functionName: 'buyTokens',
  })
		return (
			<div>
				<b>Buy G6T</b>
				<br></br>
					<input
						type='number'
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						placeholder={`100 ${G6TokenSymbol()}/0.01 ETH`}
					/>
					<button
						disabled={!write}
						onClick={() =>write ({
							value: ethers.parseUnits(String((Number(amount)*0.0001))) 
						})
					}
					>
						&nbsp;Submit&nbsp;
					</button>
					{isLoading && <>&nbsp;Approve in wallet</>}
					{isSuccess && <>&nbsp; 
						<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>Transaction details</a></>}
			</div>
		);
}

function SellG6Tokens() {
	const [amount, setAmount] = useState("");
	const { data, isLoading, isSuccess, write } = useContractWrite({
    address: G6T_SWAP_CONTRACT,
    abi: g6TSwapJson.abi,
    functionName: 'sellTokens',
  })
		return (
			<div>
        <b>Sell G6T</b>
        <br></br>
				<input
					type='number'
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					placeholder={`0.01 ETH/100 ${G6TokenSymbol()}`}
				/>
					<button
						disabled={!write}
						onClick={() => {
							write ({args: [ethers.parseUnits(amount)]})
					}}
					>
						&nbsp;Submit&nbsp;
					</button>
					{isLoading && <>&nbsp;Approve in wallet</>}
					{isSuccess && <>&nbsp; 
						<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
							Transaction details
						</a></>}
			</div>
		);
}

/* function TransferG6Tokens() {
	const [addressTo, setAddress] = useState("");
	const [amount, setAmount] = useState("");
	const { data, isLoading, isSuccess, write } = useContractWrite({
    address: G6T_ADDRESS,
    abi: g6TokenJson.abi,
    functionName: 'transfer',
  })
		return (
			<div>
				<b>Transfer Tokens</b>
				<br></br>	
					<input
						value={addressTo}
						onChange={(e) => setAddress(e.target.value)}
						placeholder='Address to (0x...)'
					/>
						<br></br>
							<input
								type='number'
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								placeholder='Amount'
							/>
						<button
							disabled={!write}
							onClick={() =>write ({
								args: [addressTo, ethers.parseUnits(amount)],
							})
						}
						>
							Transfer Tokens
						</button>
						{isLoading && <>&nbsp;Approve in wallet</>}
						{isSuccess && <>&nbsp; 
							<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
								Transaction details
							</a></>}
			</div>
		);
} */

////////\\\\\\\\     USDC SWAP   ////////\\\\\\\\

function USDCTokenSwap() {
	const {address} = useAccount();
	if (address)
	return (
		<div>
			<header className={styles.header_container}>
				<div className={styles.header}>
					<h3>USDC Swap</h3>
				</div>
			</header>
        <p><b>ETH Price: </b>{Number(CheckETHPrice()) / 10000} <USDCTokenSymbol></USDCTokenSymbol></p>
 				<CheckUSDCAllowance address={address}></CheckUSDCAllowance>
				<ApproveUSDCTokens></ApproveUSDCTokens>
					<br></br>
				<BuyUSDCTokens></BuyUSDCTokens>
					<br></br>
				<SellUSDCTokens></SellUSDCTokens>
					<br></br>
{/* 				<TransferUSDCTokens></TransferUSDCTokens>
					<br></br> */}
		</div>
	);
}

function CheckETHPrice() {
	const { data, isError, isLoading } = useContractRead({
    address: USDC_SWAP_CONTRACT,
    abi: usdcSwapJson.abi,
    functionName: 'getETHPrice',
		watch: true,
  });

	const price = Number(data) * 100;
	if (isLoading) return <div>Checking ETH price from Chainlink…</div>;
  if (isError) return <div>Error checking ETH price</div>;
  return Number(ethers.formatUnits(price, 6));
}

function CheckUSDCAllowance(params: { address: `0x${string}` }) {
	const { data, isError, isLoading } = useContractRead({
    address: USDC_ADDRESS,
    abi: usdcTokenJson.abi,
    functionName: 'allowance',
		args: [params.address, USDC_SWAP_CONTRACT],
		watch: true,
  });

	const allowance = Number(data);
	if (isLoading) return <div>Checking allowance…</div>;
  if (isError) return <div>Error checking allowance</div>;
  return <div><b>Approved Tokens: </b> {ethers.formatUnits(BigInt(allowance), 6)} <USDCTokenSymbol></USDCTokenSymbol></div>;
}

function ApproveUSDCTokens()	{
	const [amount, setAmount] = useState("");
	const { data, isLoading, isSuccess, write } = useContractWrite({
    address: USDC_ADDRESS,
    abi: usdcTokenJson.abi,
    functionName: 'approve',
  })
		return (
			<div>
				<input
					type='number'
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					placeholder="Amount"
					/>
				<button
					disabled={!write}
					onClick={() => {
						write ({
							args: [USDC_SWAP_CONTRACT, ethers.parseUnits(amount, 6)],
						})
					}}
				>
					&nbsp;Approve&nbsp;
				</button>
				{isLoading && <>&nbsp;Approve in wallet</>}
				{isSuccess && <>&nbsp; 
					<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
						Transaction details
					</a></>}
			</div>
		);
}

function BuyUSDCTokens() {
	const [amount, setAmount] = useState("");
  const ethPrice = Number(CheckETHPrice());
	const { data, isLoading, isSuccess, write } = useContractWrite({
    address: USDC_SWAP_CONTRACT,
    abi: usdcSwapJson.abi,
    functionName: 'swapToUSDC',
  })
		return (
			<div>
				<b>Buy USDC</b>
				<br></br>
					<input
						type='number'
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						placeholder={`${CheckETHPrice()}/1 ETH`}
					/>
					<button
						disabled={!write}
						onClick={() =>write ({
							value: ethers.parseUnits(String(((Number(amount))/ (ethPrice / 10000))))
						})
					}
					>
						&nbsp;Submit&nbsp;
					</button>
					{isLoading && <>&nbsp;Approve in wallet</>}
					{isSuccess && <>&nbsp; 
						<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>Transaction details</a></>}
			</div>
		);
}

function SellUSDCTokens() {
	const [amount, setAmount] = useState("");
	const { data, isLoading, isSuccess, write } = useContractWrite({
    address: USDC_SWAP_CONTRACT,
    abi: usdcSwapJson.abi,
    functionName: 'swapToETH',
  })
		return (
			<div>
        <b>Sell USDC</b>
        <br></br>
				<input
					type='number'
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					placeholder={`amount ${USDCTokenSymbol()}`}
				/>
					<button
						disabled={!write}
						onClick={() => {
							write ({args: [ethers.parseUnits(amount, 6)]})
					}}
					>
						&nbsp;Submit&nbsp;
					</button>
					{isLoading && <>&nbsp;Approve in wallet</>}
					{isSuccess && <>&nbsp; 
						<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
							Transaction details
						</a></>}
			</div>
		);
}

////////\\\\\\\\    LEND DASHBOARD ////////\\\\\\\\

function LendDashboard() {
	const {address} = useAccount();
	if (address)
	return (
		<div>
			<header className={styles.header_container}>
				<div className={styles.header}>
					<h3>Lend Dashboard</h3>
				</div>
			</header>
        <CheckUSDCAllowance address={address}></CheckUSDCAllowance>
				<ApproveUSDCTokens></ApproveUSDCTokens>
					<br></br>
		    <DepositUSDCTokens></DepositUSDCTokens>
					<br></br>
				<WithdrawUSDCTokens></WithdrawUSDCTokens>
					<br></br>
		</div>
	);
}

function DepositUSDCTokens()	{
	const [amount, setAmount] = useState("");
	const { data, isLoading, isSuccess, write } = useContractWrite({
    address: LENDING_PLAT_CONTRACT,
    abi: usdcTokenJson.abi,
    functionName: 'depositUSDC',
  })
		return (
			<div>
        <b>Deposit USDC</b>
				<br></br>
          <input
            type='number'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            />
          <button
            disabled={!write}
            onClick={() => {
              write ({
                args: [ethers.parseUnits(amount, 6)],
              })
            }}
          >
            &nbsp;Submit&nbsp;
          </button>
          {isLoading && <>&nbsp;Approve in wallet</>}
          {isSuccess && <>&nbsp; 
            <a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
              Transaction details
            </a></>}
			</div>
		);
}

/* function CheckUSDCDeposit(params: { address: `0x${string}` }) {
	const { data, isError, isLoading } = useContractRead({
    address: LENDING_PLAT_CONTRACT,
    abi: usdcTokenJson.abi,
    functionName: 'allowance',
		args: [params.address, USDC_SWAP_CONTRACT],
		watch: true,
  });

	const allowance = Number(data);
	if (isLoading) return <div>Checking allowance…</div>;
  if (isError) return <div>Error checking allowance</div>;
  return <div><b>Approved Tokens: </b> {ethers.formatUnits(BigInt(allowance), 6)} <USDCTokenSymbol></USDCTokenSymbol></div>;
} */

function WithdrawUSDCTokens()	{
	const [amount, setAmount] = useState("");
	const { data, isLoading, isSuccess, write } = useContractWrite({
    address: LENDING_PLAT_CONTRACT,
    abi: usdcTokenJson.abi,
    functionName: 'withdrawUSDC',
  })
		return (
			<div>
        <b>Withdraw USDC</b>
				<br></br>
          <input
            type='number'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            />
          <button
            disabled={!write}
            onClick={() => {
              write ({
                args: [ethers.parseUnits(amount, 6)],
              })
            }}
          >
            &nbsp;Submit&nbsp;
          </button>
          {isLoading && <>&nbsp;Approve in wallet</>}
          {isSuccess && <>&nbsp; 
            <a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
              Transaction details
            </a></>}
			</div>
		);
}

////////\\\\\\\\    BORROW DASHBOARD ////////\\\\\\\\

function BorrowDashboard() {
	const {address} = useAccount();
	if (address)
	return (
		<div>
			<header className={styles.header_container}>
				<div className={styles.header}>
					<h3>Borrow Dashboard</h3>
				</div>
			</header>
        <CheckUSDCAllowance address={address}></CheckUSDCAllowance>
				<ApproveUSDCTokens></ApproveUSDCTokens>
					<br></br>
		    <DepositColETH></DepositColETH>
					<br></br>
				<BorrowUSDCTokens></BorrowUSDCTokens>
					<br></br>
		</div>
	);
}

function DepositColETH() {
  const [amount, setAmount] = useState("");
	const { data, isLoading, isSuccess, write } = useContractWrite({
    address: USDC_SWAP_CONTRACT,
    abi: usdcSwapJson.abi,
    functionName: 'swapToUSDC',
  })
		return (
			<div>
				<b>Deposit ETH collateral</b>
				<br></br>
					<input
						type='number'
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						placeholder={`amount`}
					/>
					<button
						disabled={!write}
						onClick={() =>write ({
							value: ethers.parseUnits(String(Number(amount)))
						})
					}
					>
						&nbsp;Submit&nbsp;
					</button>
					{isLoading && <>&nbsp;Approve in wallet</>}
					{isSuccess && <>&nbsp; 
						<a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>Transaction details</a></>}
			</div>
		);
}

function BorrowUSDCTokens()	{
	const [amount, setAmount] = useState("");
	const { data, isLoading, isSuccess, write } = useContractWrite({
    address: LENDING_PLAT_CONTRACT,
    abi: usdcTokenJson.abi,
    functionName: 'borrowUSDC',
  })
		return (
			<div>
        <b>Borrow USDC</b>
				<br></br>
          <input
            type='number'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            />
          <button
            disabled={!write}
            onClick={() => {
              write ({
                args: [ethers.parseUnits(amount, 6)],
              })
            }}
          >
            &nbsp;Submit&nbsp;
          </button>
          {isLoading && <>&nbsp;Approve in wallet</>}
          {isSuccess && <>&nbsp; 
            <a target={"_blank"} href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
              Transaction details
            </a></>}
			</div>
		);
}