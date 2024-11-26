"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ethers, BrowserProvider } from "ethers";

interface AddressEntry {
  address: string;
  amount: string;
}

export default function Approve() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // States
  const [validAddresses, setValidAddresses] = useState<AddressEntry[]>([]);
  const [invalidAddresses, setInvalidAddresses] = useState<AddressEntry[]>([]);
  const [status, setStatus] = useState<"Prepare" | "Approve" | "Multisend">("Prepare");
  const [totalETH, setTotalETH] = useState<number>(0);
  const [accountETH, setAccountETH] = useState<number>(0);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [insufficientETH, setInsufficientETH] = useState<boolean>(false);

  // Load data and setup provider
  useEffect(() => {
    const validData = searchParams.get("validAddresses");
    const invalidData = searchParams.get("invalidAddresses");

    if (validData) setValidAddresses(JSON.parse(validData));
    if (invalidData) setInvalidAddresses(JSON.parse(invalidData));

    // Initialize Ethereum provider
    const initProvider = new ethers.BrowserProvider((window as any).ethereum);
    setProvider(initProvider);

    // Fetch account and balance
    const fetchAccountInfo = async () => {
      const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      setUserAddress(accounts[0]);
      const balance = await initProvider.getBalance(accounts[0]);
      setAccountETH(parseFloat(ethers.formatEther(balance)));
    };

    fetchAccountInfo();
  }, [searchParams]);

  // Calculate total ETH and check account balance
  useEffect(() => {
    const total = validAddresses.reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
    setTotalETH(total);
    setInsufficientETH(total > accountETH);
  }, [validAddresses, accountETH]);

  const goBack = () => {
    router.push("/");
  };

  const proceedToMultisend = () => {
    setStatus("Approve");
    setTimeout(() => {
      setStatus("Multisend");
      router.push({
        pathname: "/multisend",
        query: { validAddresses: JSON.stringify(validAddresses) },
      });
    }, 1000); // Simulate delay for processing
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#1e293b] to-[#0F123D] bg-opacity-80 text-white">
      <div className="max-w-4xl mx-auto py-12 px-6">
        {/* Steps Header */}
        <div className="flex flex-wrap justify-center items-center mb-8">
          <div className="flex items-center space-x-4">
            <Step stepNumber={1} label="Prepare" isActive={status === "Prepare"} />
            <div className="h-6 border-l border-gray-500"></div>
            <Step stepNumber={2} label="Approve" isActive={status === "Approve"} />
            <div className="h-6 border-l border-gray-500"></div>
            <Step stepNumber={3} label="Multisend" isActive={status === "Multisend"} />
          </div>
        </div>

        <div className="border border-blue-900 rounded-xl">
          <div className="bg-gradient-to-r from-[#1e293b] to-[#0F123D] bg-opacity-80 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 rounded-xl">
              <InfoCard label="Total ETH to send" value={`${totalETH} ETH`} />
              <InfoCard label="Your ETH balance" value={`${accountETH} ETH`} />
            </div>
          </div>

          {/* Address Lists */}
          <div className="bg-gradient-to-r from-[#1e293b] to-[#0F123D] bg-opacity-80 p-6 rounded-lg text-xs text-blue-400">
            <h3 className="text-lg font-semibold mb-4">Valid Addresses</h3>
            {validAddresses.length > 0 ? (
              validAddresses.map((entry, index) => (
                <RecipientRow key={index} address={entry.address} amount={`${entry.amount} ETH`} />
              ))
            ) : (
              <p className="text-green-500">No valid addresses found.</p>
            )}

            <h3 className="text-lg font-semibold mt-6 mb-4">Invalid Addresses</h3>
            {invalidAddresses.length > 0 ? (
              invalidAddresses.map((entry, index) => (
                <RecipientRow
                  key={index}
                  address={entry.address || "Invalid"}
                  amount={entry.amount || "N/A"}
                />
              ))
            ) : (
              <p className="text-green-500">No invalid addresses found.</p>
            )}

            {/* Insufficient ETH Warning */}
            {insufficientETH && (
              <div className="bg-red-600 text-white p-4 rounded-lg mt-4">
                <p>
                  Insufficient ETH in your account. You need at least {totalETH} ETH to proceed with the transaction.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="mt-6 space-y-4">
              <button
                onClick={goBack}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold"
              >
                Back
              </button>
              <button
                onClick={proceedToMultisend}
                disabled={validAddresses.length === 0 || status === "Multisend" || insufficientETH}
                className={`w-full ${
                  validAddresses.length > 0 && status !== "Multisend" && !insufficientETH
                    ? "bg-blue-900 hover:bg-blue-800"
                    : "bg-gray-500"
                } text-white py-3 rounded-lg font-semibold`}
              >
                {status === "Multisend" ? "Processing..." : "Proceed to Multisend"}
              </button>
            </div>
          </div>

          {/* Support Link */}
          <div className="mt-8 text-center">
            <button
              onClick={() => window.open("https://t.me/YourTelegramGroup", "_blank")}
              className="bg-blue-700 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
            >
              Support System
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StepProps {
  stepNumber: number;
  label: string;
  isActive: boolean;
}

function Step({ stepNumber, label, isActive }: StepProps) {
  return (
    <div className={`flex items-center space-x-2 ${isActive ? "text-blue-700" : "text-gray-400"}`}>
      <div
        className={`w-6 h-6 flex items-center justify-center rounded-full ${
          isActive ? "bg-blue-900" : "bg-gray-600"
        }`}
      >
        {isActive ? "✓" : stepNumber}
      </div>
      <span>{label}</span>
    </div>
  );
}

interface InfoCardProps {
  label: string;
  value: string;
}

function InfoCard({ label, value }: InfoCardProps) {
  return (
    <div className="text-center border border-blue-700 px-2 py-4 rounded-lg text-blue-500 text-xs">
      <p className="text-xl font-semibold">{value}</p>
      <p>{label}</p>
    </div>
  );
}

interface RecipientRowProps {
  address: string;
  amount: string;
}

function RecipientRow({ address, amount }: RecipientRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-700">
      <span className="text-sm truncate">{address}</span>
      <span className="text-sm font-medium">{amount}</span>
    </div>
  );
}
