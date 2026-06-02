# CLAUDE.md — Arc CCTP Bridge

> File này là context cho Claude Code khi build project. Đọc kỹ trước khi viết code.

---

## Project Overview

**Tên project**: Arc CCTP Bridge
**Repo**: `arc-cctp-bridge`
**Owner GitHub**: [@hoanghieu512](https://github.com/hoanghieu512)
**Approach**: Fork-and-rebrand từ Circle's official CCTP sample app, thêm Arc Testnet support + fix Arc-specific UX issues.

### Upstream source
- Repo gốc: https://github.com/circlefin/circle-cctp-crosschain-transfer
- License: respect license gốc (sẽ kiểm tra trong Phase 1)
- Tech stack gốc: Next.js (App Router) + TypeScript + viem (EVM) + @solana/web3.js (Solana)

### Tại sao build project này

1. **Mục đích chính (90%)**: Tương tác Arc testnet để farm airdrop tiềm năng từ Circle. Arc là Layer-1 của Circle dùng USDC làm gas token, hiện ở testnet (28/10/2025 launch), mainnet dự kiến 2026.
2. **Mục đích phụ (10%)**: Tạo builder evidence trên GitHub cho Arc/Circle team review wallet thấy contribution thật (Tier 2 evidence: deployed dapp + repo public + Arc-specific code).

### Anti-goals (KHÔNG làm)

- Không build smart contract custom (CCTP contracts đã có sẵn của Circle, không cần deploy thêm)
- Không add tính năng phức tạp (subscription, batching, multi-route...) — out of scope, ưu tiên ship nhanh
- Không tối ưu mainnet (testnet-only project)
- Không support wallet khác ngoài MetaMask + WalletConnect default (giữ scope nhỏ)

---

## Success Criteria

Project được coi là "done" khi đủ 5 tiêu chí:

1. ✅ Fork Circle's CCTP sample app, code chạy được local (`npm run dev` không lỗi)
2. ✅ Add Arc Testnet vào chain list (domain 7, USDC contract address, RPC URL)
3. ✅ Fix 3 Arc-specific UX issues (xem section "Arc-specific Fixes" bên dưới)
4. ✅ README rewrite hoàn toàn, document rõ những gì khác upstream + setup guide + screenshots
5. ✅ Deploy lên Vercel, link live, hoạt động được với MetaMask + USDC testnet

**Time budget**: 4–6 giờ work, ship trong 1 weekend.

---

## Tech Stack

| Layer | Technology | Lý do |
|-------|-----------|-------|
| Framework | Next.js 14+ (App Router) | Đã có trong fork |
| Language | TypeScript strict mode | Đã có trong fork |
| EVM client | viem | Đã có trong fork — handle CCTP flow |
| Wallet | MetaMask (injected) + WalletConnect | Đã có trong fork |
| Styling | Giữ theo upstream (kiểm tra trong Phase 1) | Không refactor |
| Deploy | Vercel free tier | Native Next.js integration |
| Chain RPC | Public RPC endpoints | Free tier, không cần Alchemy/Infura |

**KHÔNG add thêm dependency mới** trừ khi thực sự cần. Mỗi dependency thêm vào phải có lý do rõ trong commit message.

---

## Arc Testnet Configuration

Constants cần add vào project (kiểm tra với Arc docs trước khi hardcode):

- **Chain ID**: cần verify từ docs.arc.network
- **CCTP Domain**: 7 (theo nguồn community, verify với Arc docs MCP)
- **USDC contract address (Arc testnet)**: cần lookup từ Arc docs
- **TokenMessenger contract address (Arc testnet)**: cần lookup từ Arc docs
- **MessageTransmitter contract address (Arc testnet)**: cần lookup từ Arc docs
- **RPC URL**: cần lookup public RPC
- **Block explorer**: Arcscan hoặc tương đương
- **Gas token**: USDC (KHÔNG phải ETH — đây là điểm đặc biệt của Arc)
- **Native currency name/symbol/decimals**: cần verify

**Quan trọng**: KHÔNG hardcode placeholder. Mọi địa chỉ contract phải verify từ Arc docs official (qua Arc MCP nếu đã cài). Nếu chưa có info → STOP, hỏi user.

---

## Arc-specific Fixes (3 fixes bắt buộc)

Đây là 3 vấn đề đã được document trong community, là core differentiation của project so với upstream:

### Fix 1: Gas token là USDC, không phải ETH
- Upstream assume gas token = ETH cho mọi EVM chain
- Khi user ở Arc Testnet, balance display phải hiện USDC (không hiện ETH = 0)
- Logic: detect `chainId === ARC_TESTNET_CHAIN_ID` → show USDC balance trong slot gas

### Fix 2: Auto-add Arc Testnet vào MetaMask
- Upstream chỉ chuyển chain bằng `wallet_switchEthereumChain`
- Nếu user chưa add Arc Testnet → MetaMask báo "chain not found" → UX broken
- Fix: catch error code 4902 → fallback gọi `wallet_addEthereumChain` với full chain params → retry switch
- Reference: EIP-3085 spec

### Fix 3: Attestation progress indicator chi tiết
- CCTP flow có 4 step: approve → burn → wait attestation (10–20s) → mint
- Upstream có thể chỉ hiện spinner generic
- Fix: hiện progress step-by-step rõ ràng:
  - Step 1/4: "Approving USDC..." (estimated 5s)
  - Step 2/4: "Burning USDC on source chain..." (estimated 5s)
  - Step 3/4: "Waiting for Circle attestation..." (estimated 10–20s, có countdown hoặc spinner với label)
  - Step 4/4: "Minting USDC on destination chain..." (estimated 5s)
- Mỗi step có icon + label + link Arcscan/Etherscan của transaction tương ứng

---

## Project Structure

Cấu trúc sẽ inherit từ upstream. Phase 1 đầu tiên là kiểm tra structure thực tế của fork, sau đó update section này. Đến lúc đó, follow nguyên tắc:

- KHÔNG restructure folders/files của upstream — giữ nguyên để dễ merge update sau
- File mới thêm vào folder phù hợp với convention upstream
- Constants Arc-specific để trong file riêng (ví dụ `lib/chains/arc-testnet.ts`)
- Không tạo file trong root nếu có folder phù hợp

---

## Coding Conventions

1. **TypeScript strict** — không dùng `any` trừ khi unavoidable (comment lý do)
2. **Naming**: camelCase cho variables/functions, PascalCase cho types/components, SCREAMING_SNAKE_CASE cho constants
3. **Imports**: absolute imports nếu upstream đã setup, follow upstream pattern
4. **Comments**: chỉ comment khi code không tự explain. KHÔNG comment redundant
5. **Error handling**: mọi async operation phải try-catch, error message user-facing phải tiếng Anh, clear, actionable
6. **Console.log**: KHÔNG để console.log trong production code (chỉ trong file `*.dev.ts` nếu có)
7. **Git commits**: mỗi commit là 1 logical change, message theo Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`)

---

## Security Constraints

**Critical — đọc kỹ:**

1. **KHÔNG bao giờ commit private key, seed phrase, hoặc API key** vào repo
2. **KHÔNG cần `.env` với `PRIVATE_KEY`** cho project này (project là FE-only, không deploy contract custom)
3. **`.env.local`** chỉ chứa public env vars (ví dụ `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`)
4. **`.gitignore`** phải có: `.env`, `.env.local`, `.env.*.local`, `node_modules/`, `.next/`, `dist/`
5. **Wallet**: user dùng ví riêng tạo cho project Arc, KHÔNG dùng ví cá nhân hold tài sản thật
6. **MCP config**: file `.mcp.json` ở root chứa Arc Docs MCP — KHÔNG chứa secret nào, có thể commit

---

## Development Phases

Chi tiết phase-by-phase ở file `PHASES.md`. High-level:

- **Phase 0**: Environment setup (xem `SETUP.md`)
- **Phase 1**: Fork repo, chạy local, kiểm tra structure, add Arc Testnet config
- **Phase 2**: Implement 3 Arc-specific fixes
- **Phase 3**: Rebrand (logo, color, copy) + README rewrite
- **Phase 4**: Deploy Vercel, verify live, test end-to-end với MetaMask + USDC testnet

Mỗi phase có acceptance criteria rõ trong `PHASES.md`. KHÔNG move sang phase tiếp theo nếu acceptance criteria của phase hiện tại chưa pass.

---

## How Claude Code Should Work on This Project

1. **Đọc Arc Docs MCP** trước khi viết code liên quan đến Arc — đừng đoán chain ID, contract address, RPC URL
2. **Đọc upstream code** trước khi modify — hiểu pattern hiện tại trước khi thay đổi
3. **One change at a time** — không refactor lung tung, không "while we're at it"
4. **Verify mỗi change** — sau mỗi fix, chạy local, test bằng MetaMask, confirm hoạt động trước khi sang fix tiếp theo
5. **Giải thích từng bước** cho user khi build — user là QA Senior, không phải Solidity dev, cần hiểu CCTP flow đang làm gì
6. **Hỏi lại khi thiếu info** — không tự assume contract address, chain ID, hoặc API endpoint. Stop và ask user lookup từ Arc docs.

---

## Out of Scope (Explicitly Not Doing)

- ❌ Smart contract custom (CCTP contracts đã có sẵn)
- ❌ Solana support (chỉ EVM cho Phase này — Solana add sau nếu muốn)
- ❌ Mainnet deployment (testnet only)
- ❌ Multi-user features (analytics, history, user accounts)
- ❌ Custom theme system / dark mode toggle (giữ theo upstream)
- ❌ i18n / multi-language
- ❌ Mobile-first redesign (responsive đủ cho desktop, mobile là bonus)
- ❌ E2E test với Playwright/Cypress (manual test đủ cho scope này)
- ❌ CI/CD pipeline (Vercel auto-deploy là đủ)

---

## Decision Log

Quyết định lớn đã chốt trong grill phase trước build:

| Decision | Lựa chọn | Lý do |
|----------|---------|-------|
| Project type | Fork CCTP sample app | Ship nhanh, code quality cao sẵn, evidence Tier 2 |
| Tech stack | Next.js + viem (theo upstream) | Không reinvent |
| Wallet strategy | 1 ví duy nhất (mới, không dùng ví cá nhân) | Privacy + clean history + compartmentalization |
| Smart contract | KHÔNG deploy custom | CCTP contracts có sẵn |
| Evidence target | Tier 2 vững (deployed + README + repo public + Arc tags) | Match constraint "ship nhanh" |
| Deploy platform | Vercel free tier | Native Next.js |
| MCP scope | Project (`.mcp.json` ở root) | Per-project isolation |

---

## Reference Links

- Circle CCTP sample app: https://github.com/circlefin/circle-cctp-crosschain-transfer
- Arc docs: https://docs.arc.network
- Arc MCP endpoint: https://docs.arc.network/mcp
- Circle CCTP docs: https://developers.circle.com/stablecoins/docs/cctp-getting-started
- EIP-3085 (wallet_addEthereumChain): https://eips.ethereum.org/EIPS/eip-3085
- Reference blog post (Lynn The Light, 48h CCTP bridge): https://medium.com/@lynnthelight/from-zero-to-bridging-how-i-shipped-a-cross-chain-usdc-bridge-in-48-hours-339b5ed08718
