"use client";

import { useState } from "react";
import { FaCrown, FaEthereum } from "react-icons/fa";
import Image from "next/image";
import Web3 from "web3";

export default function Header() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [ethBalance, setEthBalance] = useState<string>("");

  const connectWallet = async () => {
    if (typeof window.ethereum  !== "undefined") {
      try {
        const web3 = new Web3((window as any).ethereum); // Casting to `any` because TypeScript doesn't know about `window.ethereum`
        await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3.eth.getAccounts();
        const balance = await web3.eth.getBalance(accounts[0]);
        setWalletAddress(accounts[0]);
        setEthBalance(web3.utils.fromWei(balance, "ether"));
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
      }
    } else {
      alert("MetaMask is not installed. Please install it to connect.");
    }
  };

  return (
    <header className="w-full bg-gradient-to-r from-[#1e293b] to-[#0F123D] bg-opacity-80 text-white shadow-md">
      <div className="flex flex-wrap justify-between items-center px-4 py-3 md:px-6 lg:px-8">
        {/* Logo Section */}
        <div className="text-2xl font-bold mb-2 sm:mb-0">Ledgerline Multisender</div>

        {/* Buttons Section */}
        <div className="flex flex-wrap justify-center items-center gap-3">
          {/* VIP Button */}
          <button className="text-green-500 border border-green-500 text-xs hover:bg-green-900 px-4 font-bold py-2 rounded-xl flex items-center gap-1">
            <FaCrown /> VIP
          </button>

          {/* Ethereum Button */}
          <button className="bg-[#0F123D] border border-blue-500 text-blue-500 text-xs hover:bg-sky-900 font-bold px-3 py-2 rounded-xl flex items-center gap-1">
            <FaEthereum /> Eth
          </button>

          {/* Wallet Connection */}
          {walletAddress ? (
            <div className="bg-[#0F123D] text-white text-xs border border-blue-500 px-3 py-2 hover:bg-sky-900 rounded-xl flex items-center">
              <div className="font-bold text-blue-400">
                {walletAddress.slice(0, 8)}...
              </div>
              <div className="ml-2 font-bold text-blue-400">
                {ethBalance.slice(0, 3)} ETH
              </div>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="bg-[#0F123D] text-blue-500 text-xs border border-blue-500 px-3 hover:bg-sky-900 font-bold py-2 rounded-xl flex items-center gap-1"
            >
              <Image
                src="/metamask.png"
                alt="MetaMask"
                width={20}
                height={20}
              />
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
