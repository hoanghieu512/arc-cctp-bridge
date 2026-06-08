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
 */

"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CHAIN_CONFIGS, type SupportedChainId } from "@/lib/chains";

const TOKEN_GRADIENTS = [
  "from-cyan-400 to-blue-500",
  "from-violet-400 to-fuchsia-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-rose-400 to-pink-500",
  "from-sky-400 to-indigo-500",
];

function chainInitials(name: string): string {
  const words = name.replace(/[^a-zA-Z0-9 ]/g, "").trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function ChainToken({
  chainId,
  className,
}: {
  chainId: SupportedChainId;
  className?: string;
}) {
  const name = CHAIN_CONFIGS[chainId].name;
  const gradient = TOKEN_GRADIENTS[chainId % TOKEN_GRADIENTS.length];
  return (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white shadow-inner",
        gradient,
        className,
      )}
      aria-hidden="true"
    >
      {chainInitials(name)}
    </span>
  );
}

export function ChainCombobox({
  value,
  chains,
  onChange,
  disabled,
  placeholder = "Select chain",
}: {
  value: SupportedChainId | null;
  chains: SupportedChainId[];
  onChange: (chainId: SupportedChainId) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-11 gap-2 rounded-full bg-secondary/70 pl-1.5 pr-3 font-medium hover:bg-secondary"
        >
          {value !== null ? (
            <>
              <ChainToken chainId={value} />
              <span className="truncate">{CHAIN_CONFIGS[value].name}</span>
            </>
          ) : (
            <span className="px-1.5 text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown
            size={16}
            strokeWidth={2}
            className="shrink-0 text-muted-foreground/80"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(20rem,calc(100vw-2rem))] p-0"
        align="start"
      >
        <Command
          filter={(itemValue, search) => {
            const id = Number(itemValue) as SupportedChainId;
            const name = CHAIN_CONFIGS[id]?.name.toLowerCase() ?? "";
            return name.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search network..." />
          <CommandList>
            <CommandEmpty>No network found.</CommandEmpty>
            <CommandGroup>
              {chains.map((chainId) => (
                <CommandItem
                  key={chainId}
                  value={String(chainId)}
                  onSelect={(current) => {
                    onChange(Number(current) as SupportedChainId);
                    setOpen(false);
                  }}
                >
                  <ChainToken chainId={chainId} />
                  <span className="truncate">{CHAIN_CONFIGS[chainId].name}</span>
                  {value === chainId && (
                    <Check size={16} strokeWidth={2} className="ml-auto text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
