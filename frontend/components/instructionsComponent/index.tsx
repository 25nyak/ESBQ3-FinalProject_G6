import { useState, useEffect } from 'react';
import styles from './instructionsComponent.module.css';
import { useAccount, useBalance, useContractRead, useContractWrite, useNetwork, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { ethers} from 'ethers';
import * as g6TokenJson from '../assets/G6Token.json';
import * as usdcTokenJson from '../assets/USDCToken.json';

import Footer from "@/components/instructionsComponent/navigation/footer";

const G6T_ADDRESS = '0xdCf3F6153F328A7Aacd7C688Bf39E8750a375746';   // 18 decimals
const USDC_ADDRESS = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8'   //  6 decimals
const ORACLE_ETH_USD = '0xD17ecb6579cAD73aE27596929e13b619bA9060A5' //  8 decimals
const G6T_SWAP_CONTRACT = '0x2fF3113240Cd16199de9383939E3702b2e37d7c9'
const USDC_SWAP_CONTRACT = '0x92b3c8E27921aD63A5859f8Bd266C6Fb6410b20A'

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
	if (address)
    return (
      <div>
				<header className={styles.header_container}>
					<div className={styles.header}>
						<h3>User Info</h3>
					</div>
				</header>
					<p>Connected to <i>{chain?.name}</i> network </p>
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
    abi: g6TokenJson.abi,
    functionName: "name",
  });

  const name = typeof data === "string" ? data : 0;

  if (isLoading) return <div>Fetching name…</div>;
  if (isError) return <div>Error fetching name</div>;
  return <div><b>Token: </b> {name} ({G6TokenSymbol()})</div>;
}

function USDCTokenSymbol() {
  const { data, isError, isLoading } = useContractRead({
    address: USDC_ADDRESS,
    abi: g6TokenJson.abi,
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