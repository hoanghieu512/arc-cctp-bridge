# SETUP.md — Environment Setup Checklist

> One-time setup trước khi build. Làm theo thứ tự, tick vào checkbox khi xong mỗi step.

**Time est**: 1 giờ.

---

## 1. MetaMask — Tạo ví mới cho project

### Tại sao tạo ví mới?
- Privacy: ví cá nhân cũ hold tài sản thật, không nên link public với GitHub
- Clean history: ví mới = fresh Arc builder identity
- Compartmentalization: nếu sau này lỡ leak gì, ví cá nhân vẫn safe

### Các bước

- [ ] Mở MetaMask extension
- [ ] Click icon account góc trên phải → "Add account or hardware wallet"
- [ ] Chọn "Add a new account"
- [ ] Đặt tên rõ ràng: `Arc Farm` hoặc `Arc Builder`
- [ ] **QUAN TRỌNG**: backup seed phrase / private key của account này
  - Nếu cùng seed phrase với MetaMask master → seed phrase đã có sẵn, chỉ cần biết account index
  - Nếu muốn isolate hoàn toàn → "Import account" → tạo seed phrase mới bằng tool ngoài, import vào MetaMask (advanced, optional)
- [ ] Copy address của ví mới này, lưu vào notes: `0x...`

### Backup strategy
- [ ] Viết seed phrase ra giấy, cất nơi an toàn (KHÔNG chụp ảnh, KHÔNG lưu cloud)
- [ ] HOẶC lưu vào password manager encrypted (1Password, Bitwarden, KeePass)
- [ ] KHÔNG bao giờ paste seed phrase vào bất kỳ website nào, kể cả Arc/Circle official

---

## 2. Add Arc Testnet vào MetaMask

### Method A — Auto-add qua chainlist (recommended)
- [ ] Mở https://chainlist.org (hoặc Arc docs link auto-add nếu có)
- [ ] Search "Arc Testnet"
- [ ] Click "Add to MetaMask" → MetaMask popup → confirm
- [ ] Verify MetaMask đã switch sang Arc Testnet

### Method B — Manual add (nếu Method A không có)
- [ ] MetaMask → Settings → Networks → Add a network → Add manually
- [ ] Lookup các thông số sau từ docs.arc.network:
  - Network name: `Arc Testnet`
  - RPC URL: (lookup)
  - Chain ID: (lookup)
  - Currency symbol: `USDC` (special — không phải ETH)
  - Block explorer URL: (lookup)
- [ ] Save

### Verify
- [ ] MetaMask dropdown chain selector thấy Arc Testnet
- [ ] Account đang ở Arc Testnet, balance hiện ra (sẽ là 0 USDC, sẽ fund ở step tiếp theo)

---

## 3. Lấy USDC Testnet từ Faucet

### Cần USDC trên ít nhất 2 chain để test bridge

- [ ] **Arc Testnet faucet**: lookup từ docs.arc.network, request USDC testnet về ví Arc Farm. Cần cả native gas + USDC.
- [ ] **Ethereum Sepolia USDC**: https://faucet.circle.com → chọn Ethereum Sepolia → paste address → request
  - Cũng cần SepoliaETH cho gas: https://sepoliafaucet.com (hoặc faucet khác)
- [ ] **Base Sepolia USDC**: https://faucet.circle.com → chọn Base Sepolia → request
  - Cũng cần Base Sepolia ETH cho gas

### Lưu ý
- Circle faucet thường có rate limit (24h cooldown / address)
- Mỗi lần request thường được 10 USDC testnet — đủ test nhiều lần bridge
- Nếu faucet không hoạt động → check community Discord Circle/Arc

### Verify
- [ ] Ví Arc Farm có > 0 USDC trên Arc Testnet (kiểm tra qua block explorer Arc)
- [ ] Ví Arc Farm có > 0 USDC + > 0 ETH trên Ethereum Sepolia
- [ ] Ví Arc Farm có > 0 USDC + > 0 ETH trên Base Sepolia

---

## 4. Cài Node.js 22+ (yêu cầu Circle sample app)

### Check version hiện tại
- [ ] `node -v` — nếu ≥ 22 → skip step này

### Nếu cần upgrade
- [ ] Mac: `brew install node@22` (hoặc `nvm install 22 && nvm use 22`)
- [ ] Windows: download từ nodejs.org
- [ ] Linux: dùng nvm `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash` rồi `nvm install 22`

### Verify
- [ ] `node -v` ≥ 22.x.x
- [ ] `npm -v` ≥ 10.x.x

---

## 5. Tạo GitHub Repo

- [ ] Vào https://github.com/new
- [ ] Repository name: `arc-cctp-bridge`
- [ ] Description: `USDC cross-chain bridge with Arc Testnet support, built on Circle CCTP v2`
- [ ] Visibility: **Public** (private = không phải evidence cho ai thấy)
- [ ] KHÔNG check "Add a README" (sẽ fork từ upstream sau)
- [ ] KHÔNG check ".gitignore" hay "license"
- [ ] Create repository
- [ ] Lưu URL repo: `https://github.com/hoanghieu512/arc-cctp-bridge`

---

## 6. Tạo Vercel Account + Link GitHub

- [ ] Vào https://vercel.com/signup
- [ ] Sign up bằng GitHub account `hoanghieu512`
- [ ] Authorize Vercel access repos
- [ ] Skip "Import Project" step (sẽ import sau ở Phase 4)
- [ ] Verify dashboard Vercel thấy GitHub org `hoanghieu512`

---

## 7. Cài Arc Docs MCP — Scope Project

### Trong VS Code

- [ ] Tạo folder project tạm thời để chuẩn bị MCP config:
  ```
  cd ~/Dev/projects
  mkdir arc-cctp-bridge
  cd arc-cctp-bridge
  ```
- [ ] Tạo file `.mcp.json` ở root folder này với content:
  ```json
  {
    "mcpServers": {
      "arc-docs": {
        "type": "http",
        "url": "https://docs.arc.network/mcp"
      }
    }
  }
  ```
- [ ] Mở folder này bằng VS Code: `code .`
- [ ] Mở Claude Code extension panel
- [ ] Claude Code sẽ detect `.mcp.json` → popup yêu cầu confirm trust → click "Allow"
- [ ] Verify: trong Claude Code panel, list tools available phải thấy tool từ Arc Docs MCP (tên có thể là `arc_docs_search`, `arc_docs_fetch`, hoặc tương tự)

### Lưu ý quan trọng
- Folder `arc-cctp-bridge` này chỉ là **placeholder** để giữ `.mcp.json`. Ở Phase 1, khi clone fork về, huynh sẽ:
  - Clone fork về folder mới (ví dụ `arc-cctp-bridge-fork`)
  - Hoặc clone vào folder hiện tại + giữ `.mcp.json`
  - Hoặc copy `.mcp.json` sang folder fork sau khi clone
- File `.mcp.json` sẽ commit vào repo cuối (KHÔNG chứa secret, an toàn để public)

---

## 8. Cài VS Code + Claude Code Extension (skip nếu đã có)

- [ ] VS Code: https://code.visualstudio.com (skip nếu đã cài)
- [ ] Claude Code extension: mở VS Code → Extensions → search "Claude Code" → install (publisher: Anthropic)
- [ ] Login Claude Code với account Claude Pro/Max của huynh
- [ ] Verify extension hoạt động: mở panel, gõ test message, xem response

---

## 9. (Optional) Setup Block Explorer Bookmark

Để debug nhanh khi test bridge:
- [ ] Bookmark Arc block explorer (Arcscan hoặc tương đương — lookup URL)
- [ ] Bookmark https://sepolia.etherscan.io
- [ ] Bookmark https://sepolia.basescan.org

---

## 10. Final Verification — Sẵn sàng vào Phase 1?

Tick hết các checkbox dưới để confirm có thể bắt đầu Phase 1:

- [ ] MetaMask có 1 account mới riêng cho Arc, seed phrase backup an toàn
- [ ] Arc Testnet đã add vào MetaMask, balance USDC > 0
- [ ] Ít nhất 1 chain khác (Ethereum Sepolia hoặc Base Sepolia) có USDC > 0 trong ví
- [ ] Node.js ≥ 22 cài xong
- [ ] GitHub repo `arc-cctp-bridge` empty đã tạo, public
- [ ] Vercel account linked với GitHub
- [ ] VS Code + Claude Code extension working
- [ ] Arc Docs MCP đã cài scope project, Claude Code thấy tool

**Nếu đủ 8 checkbox → tiến vào `PHASES.md` Phase 1.**
**Nếu thiếu — KHÔNG bắt đầu Phase 1, fix step thiếu trước.**

---

## Troubleshooting

### Arc Testnet faucet không hoạt động / cooldown
- Check Arc Discord channel `#faucet` hoặc community channels
- Có thể nhờ người khác send testnet USDC nếu là dev community

### Arc Docs MCP không load trong Claude Code
- Verify file `.mcp.json` đúng JSON syntax (paste vào jsonlint.com check)
- Restart VS Code
- Check Claude Code extension log
- Fallback: dùng web search tới docs.arc.network khi build

### MetaMask không thấy chain mới
- Restart browser
- Re-add manual qua Settings → Networks
- Check chain ID đúng từ Arc docs (KHÔNG đoán)

### Node.js version conflict
- Dùng nvm để switch nhanh: `nvm use 22`
- Hoặc cài nvm nếu chưa có

---

## Next Step

Sau khi pass tất cả 8 checkbox final verification → mở `PHASES.md` → Phase 1.
