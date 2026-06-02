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

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { SupportedChainId, getExplorerTxUrl } from "@/lib/chains";
import type { TransferStep } from "@/hooks/use-cross-chain-transfer";

interface ProgressStepsProps {
  currentStep: TransferStep;
  burnTxHash: string | null;
  mintTxHash: string | null;
  sourceChainId: SupportedChainId;
  destinationChainId: SupportedChainId;
}

const STEPS: {
  statusKey: TransferStep;
  labelPending: string;
  labelActive: string;
  labelDone: string;
}[] = [
  {
    statusKey: "approving",
    labelPending: "Approval",
    labelActive: "Approving USDC...",
    labelDone: "Approved",
  },
  {
    statusKey: "burning",
    labelPending: "Burn",
    labelActive: "Burning USDC...",
    labelDone: "Burned",
  },
  {
    statusKey: "waiting-attestation",
    labelPending: "Attestation",
    labelActive: "Waiting for Circle attestation...",
    labelDone: "Attested",
  },
  {
    statusKey: "minting",
    labelPending: "Mint",
    labelActive: "Minting USDC...",
    labelDone: "Minted",
  },
];

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`;
}

export function ProgressSteps({
  currentStep,
  burnTxHash,
  mintTxHash,
  sourceChainId,
  destinationChainId,
}: ProgressStepsProps) {
  const [attestationSeconds, setAttestationSeconds] = useState(0);
  const isAttesting = currentStep === "waiting-attestation";

  useEffect(() => {
    if (!isAttesting) {
      setAttestationSeconds(0);
      return;
    }
    const interval = setInterval(
      () => setAttestationSeconds((s) => s + 1),
      1000,
    );
    return () => clearInterval(interval);
  }, [isAttesting]);

  const currentIndex = STEPS.findIndex((s) => s.statusKey === currentStep);
  const isCompleted = currentStep === "completed";

  const getStepState = (index: number): "pending" | "active" | "done" => {
    if (isCompleted || currentIndex > index) return "done";
    if (currentIndex === index) return "active";
    return "pending";
  };

  const getLabel = (index: number): string => {
    const step = STEPS[index];
    const state = getStepState(index);
    if (state === "active") return step.labelActive;
    if (state === "done") return step.labelDone;
    return step.labelPending;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex justify-between">
        {STEPS.map((step, index) => {
          const state = getStepState(index);
          const isBurnStep = index === 1;
          const isMintStep = index === 3;
          const isAttestStep = index === 2;
          const burnUrl = burnTxHash
            ? getExplorerTxUrl(sourceChainId, burnTxHash)
            : null;
          const mintUrl = mintTxHash
            ? getExplorerTxUrl(destinationChainId, mintTxHash)
            : null;

          return (
            <div
              key={step.statusKey}
              className="flex flex-col items-center w-1/4 px-1"
            >
              {/* Circle indicator */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300",
                  state === "active" && "bg-blue-600 text-white",
                  state === "done" && "bg-green-500 text-white",
                  state === "pending" && "bg-gray-200 text-gray-500",
                )}
              >
                {state === "active" ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : state === "done" ? (
                  <span className="text-xs font-bold">✓</span>
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>

              {/* Step label */}
              <div className="mt-2 text-xs text-center">{getLabel(index)}</div>

              {/* Attestation elapsed timer */}
              {isAttestStep && state === "active" && (
                <div className="mt-1 text-xs text-blue-500 font-mono">
                  {formatElapsed(attestationSeconds)}
                </div>
              )}

              {/* Burn tx link */}
              {isBurnStep && burnUrl && (
                <a
                  href={burnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-xs text-blue-500 underline"
                >
                  View tx ↗
                </a>
              )}

              {/* Mint tx link */}
              {isMintStep && mintUrl && (
                <a
                  href={mintUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-xs text-blue-500 underline"
                >
                  View tx ↗
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
