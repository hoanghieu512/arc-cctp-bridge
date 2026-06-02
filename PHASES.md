# PHASES.md — Build Plan

> Working document. Update progress sau mỗi phase. KHÔNG sang phase tiếp theo nếu acceptance criteria của phase hiện tại chưa pass.

**Time budget tổng**: 4–6h work, 1 weekend.

---

## Tổng quan phase

| Phase | Tên | Time est | Status |
|-------|-----|----------|--------|
| 0 | Environment Setup | 1h | ⬜ Not started |
| 1 | Fork + Arc Testnet config | 1.5h | ⬜ Not started |
| 2 | 3 Arc-specific UX fixes | 1.5h | ⬜ Not started |
| 3 | Rebrand + README rewrite | 1h | ⬜ Not started |
| 4 | Deploy Vercel + E2E test | 0.5–1h | ⬜ Not started |

Status legend: ⬜ Not started · 🟨 In progress · ✅ Done · ❌ Blocked

---

## Phase 0 — Environment Setup

**Goal**: Setup môi trường dev sạch để Phase 1 bắt đầu không bị block.

**Scope**: Xem chi tiết step-by-step trong `SETUP.md`. High-level checklist:

- [ ] Tạo MetaMask account mới riêng cho project (KHÔNG dùng ví cá nhân)
- [ ] Backup seed phrase an toàn (paper hoặc password manager)
- [ ] Add Arc Testnet vào MetaMask manual (chain ID, RPC, currency symbol)
- [ ] Lấy USDC testnet từ faucet — Arc Testnet, Ethereum Sepolia, Base Sepolia (ít nhất 2 chain)
- [ ] Verify USDC testnet đã về ví (check trên block explorer)
- [ ] Cài Arc Docs MCP scope `project` vào VS Code Claude Code extension
- [ ] Tạo GitHub repo `arc-cctp-bridge` (public)
- [ ] Tạo Vercel account, link với GitHub
- [ ] Cài Node.js 22+ (Circle sample app yêu cầu)

### Acceptance Criteria

1. ✅ `node -v` ≥ 22
2. ✅ MetaMask thấy 1 account mới, đang ở Arc Testnet, balance USDC > 0
3. ✅ MetaMask thấy USDC > 0 trên ít nhất 1 chain khác Arc (Ethereum Sepolia hoặc Base Sepolia)
4. ✅ VS Code mở project folder, Claude Code extension thấy Arc Docs MCP available
5. ✅ GitHub repo `arc-cctp-bridge` empty đã tạo, public
6. ✅ Vercel dashboard thấy GitHub org đã connect

**KHÔNG sang Phase 1 nếu thiếu USDC testnet — phase sau sẽ block khi test.**

---

## Phase 1 — Fork + Arc Testnet Config

**Goal**: Clone Circle sample app, chạy được local, add Arc Testnet như 1 chain support.

### Scope

1. **Fork repo upstream** trên GitHub UI từ `circlefin/circle-cctp-crosschain-transfer` về account `hoanghieu512`
2. **Clone fork về local**: `git clone git@github.com:hoanghieu512/arc-cctp-bridge.git` (rename khi fork)
3. **Cài deps**: `npm install`
4. **Chạy local lần đầu**: `npm run dev`, mở `http://localhost:3000`, verify UI hiện ra
5. **Khảo sát structure**: dùng Claude Code đọc qua codebase, hiểu:
   - Chain config nằm ở đâu (thường là `lib/chains/` hoặc `constants/`)
   - CCTP flow logic nằm ở đâu (thường là hook `use-cross-chain-transfer.ts`)
   - UI component chain selector ở đâu
6. **Lookup Arc Testnet config** qua Arc Docs MCP (hoặc web search nếu MCP chưa có):
   - Chain ID
   - CCTP Domain (rumored = 7, cần verify)
   - USDC contract address
   - TokenMessenger contract address
   - MessageTransmitter contract address
   - RPC URL (public)
   - Block explorer URL
   - Native currency: USDC (special — không phải ETH)
7. **Add Arc Testnet** vào chain config theo pattern upstream đã có cho các chain khác (Ethereum Sepolia, Base Sepolia, etc.)
8. **Update UI dropdown chain selector** để Arc Testnet xuất hiện
9. **Smoke test**: chọn source = Arc Testnet, destination = Base Sepolia → UI render đúng → CHƯA cần bridge thật, chỉ kiểm tra không crash

### Files dự kiến sẽ touch

- `lib/chains/` hoặc `constants/chains.ts` (add Arc Testnet object)
- `components/<chain-selector>` (verify Arc xuất hiện trong dropdown)
- `.env.example` (nếu có RPC env var, add Arc RPC)

### Acceptance Criteria

1. ✅ `npm run dev` chạy không lỗi, mở `http://localhost:3000` thấy UI
2. ✅ Chain selector dropdown thấy "Arc Testnet" trong list
3. ✅ Chọn Arc Testnet → MetaMask popup yêu cầu switch chain, switch xong UI không crash
4. ✅ Balance USDC trên Arc Testnet được fetch đúng và display (có thể vẫn buggy về gas display — sẽ fix Phase 2)
5. ✅ Commit message rõ: `feat: add Arc Testnet support` + sub-commits cho từng thay đổi nhỏ

### Risk + Mitigation

- **Risk**: CCTP Domain Arc = 7 không chính xác → bridge sẽ fail attestation
  - **Mitigation**: verify với Arc Docs MCP trước khi hardcode. Nếu MCP không có info → STOP, hỏi Arc Discord/Circle Discord.
- **Risk**: Contract addresses (TokenMessenger, MessageTransmitter) cho Arc Testnet chưa public
  - **Mitigation**: Phase 1 này có thể chỉ add chain config + UI dropdown, deferr việc bridge thật sang Phase 2/4. Document rõ trong commit.

---

## Phase 2 — 3 Arc-Specific UX Fixes

**Goal**: Implement 3 fixes làm project differentiate từ upstream.

### Fix 1: Gas token display = USDC trên Arc

**Problem**: Upstream assume gas = ETH cho mọi EVM chain. Trên Arc, gas = USDC.

**Approach**:
- Detect current chain trong balance display component
- Nếu `chainId === ARC_TESTNET_CHAIN_ID` → show USDC balance trong slot gas thay vì ETH
- Logic: tạo 1 helper `getGasTokenSymbol(chainId)` return `"USDC"` cho Arc, `"ETH"` cho EVM chain khác

**Acceptance**:
- Switch sang Arc Testnet → UI hiện "Gas: X USDC" (KHÔNG hiện "ETH: 0")
- Switch sang Ethereum Sepolia → UI hiện "Gas: X ETH" như cũ

### Fix 2: Auto-add Arc Testnet vào MetaMask

**Problem**: Nếu user chưa add Arc Testnet vào MetaMask manual, click switch sẽ báo "chain not found" → broken UX.

**Approach**:
- Wrap `wallet_switchEthereumChain` call trong try-catch
- Bắt error code `4902` (chain not added) → fallback gọi `wallet_addEthereumChain` với full Arc chain params
- Sau khi add thành công → retry switch
- Reference: EIP-3085 spec

**Acceptance**:
- Test với 1 MetaMask fresh (chưa add Arc) → click chọn Arc → MetaMask popup "Add Network" với full params → confirm → tự switch sang Arc → UI tiếp tục bình thường

### Fix 3: Attestation Progress Indicator

**Problem**: CCTP có 4 step, mỗi step có timing khác nhau. Upstream có thể chỉ hiện spinner generic → user không biết đang stuck hay đang chờ đúng flow.

**Approach**:
- Tạo component `<BridgeProgress />` hiện 4 step rõ ràng:
  - Step 1/4: "Approving USDC" — icon ⏳ → ✅ khi approve tx confirmed
  - Step 2/4: "Burning USDC on source chain" — show source tx hash + link explorer
  - Step 3/4: "Waiting for Circle attestation" — show timer countdown 10–20s, label "Circle is signing your transfer..."
  - Step 4/4: "Minting USDC on destination chain" — show destination tx hash + link explorer
- Mỗi step có 3 state: pending (chưa tới), active (đang chạy), done (xong)

**Acceptance**:
- Bridge USDC Ethereum Sepolia → Base Sepolia → quan sát 4 step lần lượt hiện
- Mỗi step có icon trạng thái + label + (nếu có) link explorer

### Acceptance Criteria (Phase 2 overall)

1. ✅ 3 fix trên đều implement xong, commit riêng biệt với message rõ
2. ✅ Bridge end-to-end thử thành công với 1 cặp chain (ưu tiên Ethereum Sepolia → Base Sepolia trước để verify CCTP flow hoạt động) — KHÔNG bắt buộc phải bridge Arc thành công nếu Arc contract chưa ready
3. ✅ Code review: KHÔNG hardcode magic number (chain ID, domain) inline — phải dùng constant
4. ✅ Không có console.log leftover

---

## Phase 3 — Rebrand + README Rewrite

**Goal**: Project có signature riêng + README đủ chất lượng cho Tier 2 evidence.

### Scope

1. **Tên + logo**:
   - Đổi title trong `<head>` thành "Arc CCTP Bridge"
   - Đổi tên trong header UI
   - Logo: text-based đơn giản (không cần design phức tạp) — ví dụ "🌉 Arc CCTP Bridge"
2. **Color scheme** (optional, chỉ nếu có time):
   - Đổi 1–2 màu primary để có signature riêng — KHÔNG redesign toàn bộ
3. **README.md** rewrite từ đầu, cấu trúc:
   - Title + 1 dòng tagline
   - Demo link (Vercel) + screenshot
   - **What's different from upstream** — section này quan trọng nhất cho evidence. List 3 fix + Arc support
   - **Tech stack** (ngắn)
   - **Setup** (clone, install, env, run)
   - **Supported chains** (table)
   - **Known limitations** (honest về gì chưa work)
   - **Credits**: link upstream `circlefin/circle-cctp-crosschain-transfer`, respect license
   - **License**: theo upstream
4. **Repo metadata**:
   - Description: "USDC cross-chain bridge with Arc Testnet support, built on Circle CCTP v2"
   - Topics/tags: `arc-network`, `cctp`, `circle-usdc`, `usdc-bridge`, `cross-chain`, `testnet`, `viem`, `nextjs`
   - Website URL: link Vercel deployment
5. **Screenshot**: chụp 1 screenshot UI đẹp, lưu vào `docs/screenshot.png`, embed vào README

### Acceptance Criteria

1. ✅ Page title browser tab hiện "Arc CCTP Bridge"
2. ✅ README có đủ 7 section trên
3. ✅ README mention rõ "Forked from circlefin/circle-cctp-crosschain-transfer" + link
4. ✅ Repo GitHub có description + tags + website URL
5. ✅ Có ít nhất 1 screenshot embed trong README
6. ✅ README đọc qua 1 lần không có typo lớn, link không broken

---

## Phase 4 — Deploy Vercel + E2E Test

**Goal**: Project live trên Vercel, accessible URL, bridge thật chạy được end-to-end.

### Scope

1. **Push code lên GitHub** (đảm bảo `.env.local` không leak)
2. **Connect Vercel với repo**:
   - Import project từ GitHub
   - Verify framework detect = Next.js
   - Add env vars cần thiết (nếu có — ví dụ `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`)
3. **Deploy** lần đầu, fix nếu build fail
4. **Verify deployment**:
   - Mở Vercel URL, UI render đúng
   - Connect MetaMask hoạt động
   - Switch chain hoạt động
5. **E2E test bridge thật**:
   - Test case 1: Bridge USDC từ Ethereum Sepolia → Base Sepolia (verify CCTP flow chuẩn)
   - Test case 2: Bridge USDC từ Ethereum Sepolia → Arc Testnet (đây là test quan trọng nhất, verify Arc support hoạt động)
   - Test case 3: Bridge USDC từ Arc Testnet → Base Sepolia (verify Arc làm source được)
6. **Document kết quả** test trong README hoặc CHANGELOG (test case nào pass, fail, blocker)
7. **Update Vercel URL vào repo description + README** screenshot link

### Acceptance Criteria

1. ✅ `https://arc-cctp-bridge.vercel.app` (hoặc tương tự) accessible public
2. ✅ Connect MetaMask trên Vercel URL hoạt động
3. ✅ Ít nhất 1 trong 3 test case bridge thành công (USDC về ví đích, có tx hash verify được)
4. ✅ Kết quả test documented trong repo (README hoặc CHANGELOG)

### Risk + Mitigation

- **Risk**: Arc Testnet CCTP contract chưa active hoặc attestation API chưa support Arc
  - **Mitigation**: nếu Arc bridge fail nhưng EVM↔EVM bridge khác work, vẫn ship dapp với label "Arc support: experimental, depends on Circle's attestation API". Vẫn đủ Tier 2 evidence vì code đã handle Arc chain.

---

## Done Definition (Project Level)

Project được coi là "shipped" khi:

- [x] Tất cả 4 phase pass acceptance criteria
- [x] Repo public trên GitHub với đầy đủ README + tags + description
- [x] Vercel URL live và accessible
- [x] Đã làm ít nhất 5 CCTP transaction thật trên Arc (farming activity bắt đầu)
- [x] Đã link ví farm với GitHub bio hoặc README (builder identity signal)

---

## Post-ship (Out of build scope, nhưng nên làm)

Sau khi ship project, để tối ưu farm:

1. **Tương tác đều đặn**: 2–3 lần/tuần, bridge USDC qua lại Arc với chain khác, mỗi lần khác amount
2. **Diversify**: thử bridge với multiple destination chains (Ethereum Sepolia, Base Sepolia, Avalanche Fuji nếu Arc support)
3. **Post X**: tweet về project, tag @circle, @arc — builder visibility signal
4. **Consider PR upstream**: nếu Arc support đủ chất lượng, submit PR về `circlefin/circle-cctp-crosschain-transfer`. Đây là Tier 1 evidence mạnh nhất.
5. **Monitor airdrop announcements**: theo dõi Arc/Circle official channels (Twitter @circle, @arc, Discord, blog) cho thông tin airdrop chính thức

---

## Phase Progress Log

> Update tay khi build. Format: `[YYYY-MM-DD HH:MM] Phase X: <event>`

```
[chưa bắt đầu]
```
