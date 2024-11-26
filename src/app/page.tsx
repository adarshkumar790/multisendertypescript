"use client";
import { useState, useEffect, ChangeEvent } from "react";
import { FaCrown, FaEthereum, FaCoins, FaFileCsv } from "react-icons/fa"; // Import additional icons
import Image from "next/image"; // For MetaMask logo
import Web3 from "web3";
import Link from "next/link";
import axios from "axios";

interface CsvRow {
  address: string;
  amount?: string;
}

export default function Home() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState<string>("");
  const [lineNumbers, setLineNumbers] = useState<string>(""); // Line numbers state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [status, setStatus] = useState<number>(1); // 1: Prepare, 2: Approve, 3: Multisend
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [ethBalance, setEthBalance] = useState<string>("");
  const [csvError, setCsvError] = useState<boolean>(false);
  const [tokens, setTokens] = useState<any[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>("");

  const ETHERSCAN_API_KEY = "TB1VJYA5CY54TF4HV5XR41957DC2QW99ZY";

  // Update line numbers dynamically whenever csvText changes
  useEffect(() => {
    const updateLineNumbers = () => {
      if (!csvText) return ""; // Handle empty or undefined csvText
      const lines = csvText.split("\n");
      return lines.map((_, index) => index + 1).join("\n");
    };
    setLineNumbers(updateLineNumbers());
  }, [csvText]);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setCsvText(result);
        validateCsv(result);
      };
      reader.readAsText(file);
    } else {
      alert("Please upload a valid CSV file.");
    }
  };

  const handleCsvTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setCsvText(value);
    validateCsv(value);
  };

  const validateCsv = (csvData: string) => {
    const lines = csvData.split("\n");
    const isValid = lines.every((line) => {
      const [address] = line.split(",").map((item) => item.trim());
      return address && address.length === 42;
    });

    setCsvError(!isValid);
  };

  const showCsvFormat = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const parseCsv = (): { valid: CsvRow[]; invalid: CsvRow[] } => {
    const lines = csvText.split("\n");
    const valid: CsvRow[] = [];
    const invalid: CsvRow[] = [];
    lines.forEach((line) => {
      const [address, amount] = line.split(",").map((item) => item.trim());
      if (address && address.length === 42) {
        valid.push({ address, amount });
      } else {
        invalid.push({ address, amount });
      }
    });
    return { valid, invalid };
  };

  // Fetch tokens for the connected MetaMask wallet
  const fetchTokens = async (address: string) => {
    try {
      const response = await axios.get(
        `https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`
      );

      const tokenTransfers = response.data.result;
      const tokenData = tokenTransfers.reduce((acc: any, tx: any) => {
        const tokenAddress = tx.contractAddress;
        if (!acc[tokenAddress]) {
          acc[tokenAddress] = {
            symbol: tx.tokenSymbol,
            balance: 0,
            address: tokenAddress,
          };
        }
        acc[tokenAddress].balance += parseFloat(tx.value) / 10 ** tx.tokenDecimal;
        return acc;
      }, {});

      setTokens(Object.values(tokenData)); // Set token data to state
      console.log("Fetched Token Data:", tokenData);
    } catch (error) {
      console.error("Error fetching token data:", error);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3.eth.getAccounts();
        const balance = await web3.eth.getBalance(accounts[0]);
        setWalletAddress(accounts[0]);
        setEthBalance(web3.utils.fromWei(balance, "ether"));
        fetchTokens(accounts[0]); // Fetch tokens for the connected wallet
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
      }
    } else {
      alert("MetaMask is not installed. Please install it to connect.");
    }
  };

  const csvExample = [
    "0xd88d0f22f9bc682afa550da99062b3865088386d, 0.000056",
    "pavlik.eth, 12",
    "0x64c9525A3c3a65Ea88b06f184F074C2499578A7E, 1",
    "0xC8c30Fa803833dD1Fd6DBCDd91Ed0b301EFf87cF, 13.45",
    "0x7D52422D3A5fE9bC92D3aE8167097eE09F1b347d, 1.049",
  ];

  const { valid, invalid } = parseCsv();

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#1e293b] to-[#0F123D] bg-opacity-60 text-white flex flex-col items-center">
      <main className="flex flex-col items-center mt-10 w-full max-w-2xl bg-gradient-to-r from-[#1e293b] to-[#0F123D] bg-opacity-80 rounded-2xl shadow-lg p-6 bg-opacity-80 backdrop-blur-md">
        {/* Status bar */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 ${
                  status >= step ? "bg-green-500" : "bg-gray-500"
                } text-white rounded-full w-8 h-8 justify-center`}
              >
                <span>{step}</span>
              </div>
              <div className="text-xs font-bold text-blue-700">
                {["Prepare", "Approve", "Multisend"][step - 1]}
              </div>
              {step < 3 && <div className="h-6 border-l border-gray-500"></div>}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="w-full bg-gradient-to-r from-[#1e293b] to-[#0F123D] bg-opacity-80 rounded-lg p-4">
          
          <div className="w-full mb-6">
            <label className="block text-xs font-bold mb-2">Token Address</label>
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-lg">
                  <FaCoins />
                </span>
                <input
                  type="text"
                  placeholder="Select your Token"
                  className="w-full bg-[#0F123D] text-white px-10 py-2 rounded border border-gray-500"
                />
              </div>
              <div>
                <input type="checkbox" id="deflationary" className="mr-2" />
                <label htmlFor="deflationary">Deflationary</label>
              </div>
            </div>
          </div>

          {/* CSV upload */}
          <div className="w-full mt-6 relative">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold mb-2">
                List of Addresses in CSV
              </label>
              <button
                onClick={showCsvFormat}
                className="bg-[#0F123D] text-sky-400 font-bold px-3 py-1 rounded text-xs"
              >
                Show CSV Format
              </button>
            </div>
            <div className="flex border border-gray-500 rounded h-32 overflow-hidden">
              <pre
                className="bg-[#0F123D] text-gray-500 px-3 py-2 text-right"
                style={{ minWidth: "2.5rem" }}
              >
                {lineNumbers}
              </pre>
              <textarea
                placeholder="Insert your CSV here"
                className={`w-full bg-[#0F123D] text-white px-4 py-2 rounded-none resize-none h-32 ${
                  csvError ? "border-red-500" : "border-gray-500"
                }`}
                value={csvText}
                onChange={handleCsvTextChange}
              />
            </div>
            <div className="absolute right-2 bottom-[-1rem]">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="uploadCSV"
              />
              <label
                htmlFor="uploadCSV"
                className="flex items-center bg-[#0F123D] text-sky-400 text-xs font-bold px-4 py-2 rounded cursor-pointer border border-gray-500 border-t-0"
              >
                <FaFileCsv className="mr-2" /> Upload CSV
              </label>
            </div>
          </div>

          {/* Connect Wallet / Continue */}
          <div className="mt-8">
            {walletAddress ? (
              <Link
                href={{
                  pathname: "/approve",
                  query: {
                    validAddresses: JSON.stringify(valid),
                    invalidAddresses: JSON.stringify(invalid),
                  },
                }}
              >
                <button className="bg-green-500 hover:bg-green-600 text-white w-full font-bold py-2 rounded-xl">
                  Continue
                </button>
              </Link>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-blue-800 hover:bg-blue-600 text-white w-full font-bold py-2 rounded-xl"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-[#0F123D] text-white rounded-lg p-6 max-w-4xl w-full border-4 border-gray-500">
            <h3 className="text-lg font-bold mb-4">CSV Format Example</h3>
            <div className="space-y-2">
              {csvExample.map((line, index) => (
                <div key={index} className="flex border-b border-gray-500 py-2">
                  <span className="w-12 text-right text-gray-300">
                    {index + 1}.
                  </span>
                  <span className="text-gray-500">{line}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button className="text-red-500 font-bold" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
