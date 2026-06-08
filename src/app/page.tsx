/**
 * Copyright (c) 2025, Circle Internet Group, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpDown,
  Bell,
  RefreshCw,
  Settings,
  Wallet,
} from "lucide-react";

import { useCrossChainTransfer } from "@/hooks/use-cross-chain-transfer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ParticleButton } from "@/components/ui/particle-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChainCombobox, ChainToken } from "@/components/chain-combobox";
import { TransferTypeSelector } from "@/components/transfer-type";
import { ProgressSteps } from "@/components/progress-step";
import { TransferLog } from "@/components/transfer-log";
import { Timer } from "@/components/timer";
import {
  SupportedChainId,
  SUPPORTED_CHAINS,
  CHAIN_CONFIGS,
  getGasTokenSymbol,
} from "@/lib/chains";
import {
  connectEvmWallet,
  connectSolanaWallet,
  discoverEvmWallets,
  disconnectSolanaWallet,
  type EvmProviderOption,
  type WalletConnections,
} from "@/lib/browser-wallets";

export default function Home() {
  const {
    currentStep,
    logs,
    error,
    executeTransfer,
    getBalance,
    reset,
    burnTxHash,
    mintTxHash,
  } = useCrossChainTransfer();
  const [sourceChain, setSourceChain] = useState<SupportedChainId>(
    SupportedChainId.ARC_TESTNET,
  );
  const [destinationChain, setDestinationChain] = useState<SupportedChainId>(
    SupportedChainId.ETH_SEPOLIA,
  );
  const [amount, setAmount] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);
  const [showFinalTime, setShowFinalTime] = useState(false);
  const [transferType, setTransferType] = useState<"fast" | "standard">("fast");
  const [balance, setBalance] = useState("0");
  const [wallets, setWallets] = useState<WalletConnections>({
    evm: null,
    solana: null,
  });
  const [evmWalletOptions, setEvmWalletOptions] = useState<EvmProviderOption[]>(
    [],
  );
  const [showEvmWalletPicker, setShowEvmWalletPicker] = useState(false);

  const needsEvmWallet =
    sourceChain !== SupportedChainId.SOLANA_DEVNET ||
    destinationChain !== SupportedChainId.SOLANA_DEVNET;
  const needsSolanaWallet =
    sourceChain === SupportedChainId.SOLANA_DEVNET ||
    destinationChain === SupportedChainId.SOLANA_DEVNET;
  const missingRequiredWallet =
    (needsEvmWallet && !wallets.evm) || (needsSolanaWallet && !wallets.solana);

  const isCompleted = currentStep === "completed";
  const numericAmount = parseFloat(amount);
  const numericBalance = parseFloat(balance) || 0;
  const overBalance = numericAmount > numericBalance;
  const canTransfer =
    !isTransferring &&
    !isCompleted &&
    !!amount &&
    numericAmount > 0 &&
    !missingRequiredWallet;

  const handleStartTransfer = async () => {
    setIsTransferring(true);
    setShowFinalTime(false);
    setElapsedSeconds(0);
    try {
      reset();
      await executeTransfer(
        sourceChain,
        destinationChain,
        amount,
        transferType,
        wallets,
      );
    } catch (error) {
      console.error("Transfer failed:", error);
    } finally {
      setIsTransferring(false);
      setShowFinalTime(true);
    }
  };

  const handleReset = () => {
    reset();
    setIsTransferring(false);
    setShowFinalTime(false);
    setElapsedSeconds(0);
  };

  const handleSwapDirection = () => {
    setSourceChain(destinationChain);
    setDestinationChain(sourceChain);
  };

  const handleEvmWalletClick = async () => {
    if (wallets.evm) {
      setWallets((current) => ({ ...current, evm: null }));
      return;
    }

    try {
      const options = await discoverEvmWallets();
      if (options.length > 1) {
        setEvmWalletOptions(options);
        setShowEvmWalletPicker(true);
        return;
      }

      const connection = await connectEvmWallet(options[0]);
      setWallets((current) => ({ ...current, evm: connection }));
    } catch (error) {
      console.error("Failed to connect EVM wallet:", error);
    }
  };

  const handleEvmWalletSelect = async (provider: EvmProviderOption) => {
    try {
      const connection = await connectEvmWallet(provider);
      setWallets((current) => ({ ...current, evm: connection }));
      setShowEvmWalletPicker(false);
    } catch (error) {
      console.error("Failed to connect selected EVM wallet:", error);
    }
  };

  const handleSolanaWalletClick = async () => {
    if (wallets.solana) {
      try {
        await disconnectSolanaWallet(wallets.solana);
      } catch (error) {
        console.error("Failed to disconnect Solana wallet:", error);
      }
      setWallets((current) => ({ ...current, solana: null }));
      return;
    }

    try {
      const connection = await connectSolanaWallet();
      setWallets((current) => ({ ...current, solana: connection }));
    } catch (error) {
      console.error("Failed to connect Solana wallet:", error);
    }
  };

  const handleConnectRequired = () => {
    if (needsEvmWallet && !wallets.evm) {
      void handleEvmWalletClick();
      return;
    }
    if (needsSolanaWallet && !wallets.solana) {
      void handleSolanaWalletClick();
    }
  };

  useEffect(() => {
    const wrapper = async () => {
      try {
        const balance = await getBalance(sourceChain, wallets);
        setBalance(balance);
      } catch (error) {
        console.error("Failed to get balance:", error);
        setBalance("0");
      }
    };
    wrapper();
  }, [sourceChain, wallets, getBalance]);

  const formatAddress = (address: string | null) => {
    if (!address) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const destinationChains = SUPPORTED_CHAINS.filter(
    (chainId) => chainId !== sourceChain,
  );
  const receiveDisplay = amount && numericAmount > 0 ? amount : "0.00";
  const estimatedTime =
    transferType === "fast" ? "~30 sec – 2 min" : "~13 – 19 min";

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="app-glow" />

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-6xl flex-col px-4 sm:px-6">
        {/* ---------------- Top navigation ---------------- */}
        <header className="flex items-center justify-between gap-3 py-5">
          <div className="flex items-center gap-3">
            <span
              className="text-xl font-bold tracking-tight"
              title="Arc CCTP Bridge"
            >
              Arc<span className="text-primary">_Bridge</span>
            </span>
            <span className="hidden rounded-full border border-border/60 bg-card/40 px-3 py-1 font-mono text-[11px] tracking-[0.18em] text-muted-foreground backdrop-blur sm:inline-block">
              {"{ CROSS-CHAIN USDC }"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Notifications"
              title="No new notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/50 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Bell size={18} />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-destructive" />
            </button>

            {needsSolanaWallet && (
              <WalletPill
                label="Solana"
                address={wallets.solana?.address ?? null}
                onClick={handleSolanaWalletClick}
                formatAddress={formatAddress}
              />
            )}
            <WalletPill
              label="EVM"
              address={wallets.evm?.address ?? null}
              providerName={wallets.evm?.providerInfo?.name}
              onClick={handleEvmWalletClick}
              formatAddress={formatAddress}
            />
          </div>
        </header>

        {/* ---------------- Swap / bridge card ---------------- */}
        <main className="flex flex-1 flex-col items-center pb-16 pt-6 sm:pt-10">
          <div className="w-full max-w-md rounded-[28px] border border-border/60 bg-card/60 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
            {/* Card header: title + settings */}
            <div className="mb-2 flex items-center justify-between px-3 pt-1">
              <div className="flex flex-col">
                <span className="text-base font-semibold leading-none">
                  Bridge USDC
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  Powered by Circle CCTP v2
                </span>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-muted-foreground hover:text-foreground"
                    aria-label="Transfer settings"
                  >
                    <Settings size={18} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 space-y-3">
                  <div>
                    <p className="text-sm font-semibold">Transfer type</p>
                    <p className="text-xs text-muted-foreground">
                      Choose how fast finality is reached.
                    </p>
                  </div>
                  <TransferTypeSelector
                    value={transferType}
                    onChange={setTransferType}
                  />
                  <p className="text-xs text-muted-foreground">
                    {transferType === "fast"
                      ? "Faster transfers with lower finality threshold (1000 blocks)."
                      : "Standard transfers with higher finality (2000 blocks)."}
                  </p>
                </PopoverContent>
              </Popover>
            </div>

            {/* You Pay */}
            <div className="rounded-3xl bg-secondary/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  You send
                </span>
                <span className="text-xs text-muted-foreground">
                  Gas: {getGasTokenSymbol(sourceChain)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <ChainCombobox
                  value={sourceChain}
                  chains={SUPPORTED_CHAINS}
                  onChange={setSourceChain}
                />
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  max={numericBalance || undefined}
                  step="any"
                  aria-label="Amount to send"
                  className="w-0 flex-1 bg-transparent text-right font-mono text-3xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>
                    Balance:{" "}
                    <span className="text-foreground/90">{balance}</span> USDC
                  </span>
                  <button
                    type="button"
                    onClick={() => setAmount(balance)}
                    className="font-semibold text-primary transition-opacity hover:opacity-80"
                  >
                    Max
                  </button>
                </div>
                <span
                  className={cn(
                    "font-mono text-muted-foreground",
                    overBalance && "text-destructive",
                  )}
                >
                  ${receiveDisplay}
                </span>
              </div>
            </div>

            {/* Direction toggle */}
            <div className="relative z-10 -my-3 flex justify-center">
              <button
                type="button"
                onClick={handleSwapDirection}
                aria-label="Swap source and destination"
                className="group flex h-11 w-11 items-center justify-center rounded-full border-4 border-card bg-secondary text-foreground shadow-lg transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <ArrowUpDown
                  size={18}
                  className="transition-transform duration-300 group-hover:rotate-180"
                />
              </button>
            </div>

            {/* Receive */}
            <div className="rounded-3xl bg-secondary/40 p-4">
              <span className="text-sm font-medium text-muted-foreground">
                You receive
              </span>
              <div className="mt-3 flex items-center justify-between gap-3">
                <ChainCombobox
                  value={destinationChain}
                  chains={destinationChains}
                  onChange={setDestinationChain}
                />
                <span className="w-0 flex-1 truncate text-right font-mono text-3xl font-semibold tracking-tight text-foreground">
                  {receiveDisplay}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>USDC on {CHAIN_CONFIGS[destinationChain].name}</span>
                <span className="font-mono">${receiveDisplay}</span>
              </div>

              {/* Route summary: rate, fee, gas, estimated time */}
              <div className="mt-3 space-y-2 border-t border-border/50 pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-mono">1 USDC = 1 USDC</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bridge fee</span>
                  <span className="font-mono text-emerald-400">Free</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Network gas</span>
                  <span className="font-mono">
                    paid in {getGasTokenSymbol(sourceChain)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estimated time</span>
                  <span className="font-mono text-foreground/90">
                    {estimatedTime}
                  </span>
                </div>
              </div>
            </div>

            {overBalance && (
              <p className="mt-3 px-2 text-center text-xs text-destructive">
                Amount exceeds your available balance.
              </p>
            )}

            {/* Primary CTA */}
            <div className="mt-3 px-1">
              {missingRequiredWallet ? (
                <Button
                  onClick={handleConnectRequired}
                  className="h-14 w-full gap-2 rounded-2xl bg-gradient-to-r from-primary to-sky-400 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-95"
                >
                  <Wallet size={18} />
                  Connect Wallet
                </Button>
              ) : (
                <ParticleButton
                  onClick={handleStartTransfer}
                  disabled={!canTransfer}
                  className="h-14 w-full rounded-2xl bg-gradient-to-r from-primary to-sky-400 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-95 disabled:opacity-40"
                >
                  {isTransferring
                    ? "Bridging…"
                    : isCompleted
                      ? "Bridge complete"
                      : "Bridge USDC"}
                </ParticleButton>
              )}

              {(isCompleted || currentStep === "error") && (
                <Button
                  variant="ghost"
                  onClick={handleReset}
                  className="mt-2 h-10 w-full gap-2 rounded-2xl text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw size={16} />
                  Start a new transfer
                </Button>
              )}
            </div>
          </div>

          {/* Live status under the card */}
          {(isTransferring ||
            showFinalTime ||
            currentStep !== "idle" ||
            logs.length > 0) && (
            <div className="mt-8 w-full max-w-2xl space-y-6">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Elapsed
                </span>
                {showFinalTime ? (
                  <div className="font-mono text-2xl">
                    {Math.floor(elapsedSeconds / 60)
                      .toString()
                      .padStart(2, "0")}
                    :{(elapsedSeconds % 60).toString().padStart(2, "0")}
                  </div>
                ) : (
                  <Timer isRunning={isTransferring} onTick={setElapsedSeconds} />
                )}
              </div>

              <ProgressSteps
                currentStep={currentStep}
                burnTxHash={burnTxHash}
                mintTxHash={mintTxHash}
                sourceChainId={sourceChain}
                destinationChainId={destinationChain}
              />

              {logs.length > 0 && <TransferLog logs={logs} />}

              {error && (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-center text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* EVM wallet picker */}
      <Dialog open={showEvmWalletPicker} onOpenChange={setShowEvmWalletPicker}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Choose a wallet</DialogTitle>
            <DialogDescription>
              Multiple EVM wallets were detected. Pick one to connect.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {evmWalletOptions.map((option) => (
              <Button
                key={option.info.uuid}
                variant="secondary"
                className="h-12 justify-start gap-3 rounded-xl"
                onClick={() => handleEvmWalletSelect(option)}
              >
                {option.info.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WalletPill({
  label,
  address,
  providerName,
  onClick,
  formatAddress,
}: {
  label: string;
  address: string | null;
  providerName?: string;
  onClick: () => void;
  formatAddress: (address: string | null) => string | null;
}) {
  const connected = !!address;
  return (
    <button
      type="button"
      onClick={onClick}
      title={
        connected
          ? `${providerName ? providerName + " · " : ""}Click to disconnect`
          : `Connect ${label} wallet`
      }
      className={cn(
        "flex items-center gap-2 rounded-full border border-border/60 bg-card/50 py-1.5 pl-3 pr-1.5 text-sm font-medium transition-colors hover:border-primary/50",
        !connected && "text-muted-foreground",
      )}
    >
      {connected ? (
        <>
          <span className="font-mono text-foreground">
            {formatAddress(address)}
          </span>
          <span className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-sky-400" />
        </>
      ) : (
        <>
          <Wallet size={15} />
          <span className="pr-1.5">Connect {label}</span>
        </>
      )}
    </button>
  );
}
