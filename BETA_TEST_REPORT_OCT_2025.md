## Compound Mini App – Internal Beta Report (Oct 6–20, 2025)

**Scope**: Telegram Mini App experience (`@compoundminiapp`) on Sepolia testnet  
**Beta window**: 2025-10-06 → 2025-10-20  
**Participants**: 5 internal testers 
**Source data**: `BETA_TEST_SURVEY_OCT_2025.json` (direct in-app form submissions)

---

### 1. Overall findings

- **Product readiness**
  - Core flows (supply → dashboard → borrow → repay → withdraw) are **functionally complete and stable**.
  - Wallet connection via **Reown AppKit button** is perceived as **trustworthy and fast** across web and Telegram clients.
 

- **Key strengths**
  - **Dashboard & health factor**: Clear presentation of supplied vs borrowed amounts and health factor; gives users a good mental model of risk.
  - **Performance**: Transactions confirm quickly on Sepolia and UI generally keeps up with state changes.
  - **Visual design**: Consistently praised as polished, “production-like”, and trustworthy.

- **Key risks / gaps**
  - **Repay UX on Telegram**: Wallet wake + progress indication is fragile and occasionally confusing.
  - **Network visibility**: Sepolia/testnet context and active network are not always obvious.
  - **Guest mode & education**: Initial experience for new-to-DeFi users is visually strong but lacks explanation and full read-only views.

---

### 2. Thematic feedback and related changes

#### 2.1 Repay flow and wallet UX (Telegram + web)

**What testers said**

- Repay sometimes appeared to “hang” after wallet confirmation, with the UI stuck on the review state.
- On Telegram, wallet wake was unreliable; testers had to manually foreground the wallet.
- It was unclear when the app was waiting on the wallet vs waiting on the chain.

**Underlying issues (from survey)**

- Lack of explicit “waiting for confirmation” UI in repay.
- Inconsistent wallet wake behaviour in Telegram deep-link / WalletConnect sessions.
- Network mismatch warnings arriving late in the flow.

**Key commits that address this**

- `4707257` – **fix(repay)**: Use `wagmi` `writeContract` + `viem` client, remove direct ethers injection, and fix allowance/receipt flow.
- `e007f96` – **fix(repay)**: Enforce correct chain via `wagmi` switch; pass `chainId` on writes while keeping `viem` reads.
- `6142233` – **fix(repay)**: Nudge wallet in Telegram WalletConnect sessions with deep-link wake; maintain `viem` reads + `wagmi` writes.
- `e1c068d` – **feat(telegram)**: Improve wallet UX in Telegram mini app, add resilient deep-link fallbacks and foreground prompts for approve/repay.

**Status**

- After these changes, the repay path is standardized on `wagmi` + `viem` with more reliable wallet wake on Telegram. Remaining work is mostly **UX affordances** (clearer loading/progress states) rather than protocol correctness.

---

#### 2.2 Network defaults and environment clarity (Sepolia)

**What testers said**

- It was not obvious that the app was running on **Sepolia testnet** by default.
- Some testers started flows on the wrong network and only saw a warning at the moment of submission.
- Newer users were unsure whether they were dealing with “real funds”.

**Underlying issues**

- Network context (labeling, banners) is subtle.
- Environment configuration was brittle, occasionally surfacing generic errors.

**Key commits that address this**

- `304f25b` – **feat(network)**: Default to Sepolia when `NEXT_PUBLIC_NETWORK` is unset and add flexible RPC env resolution; introduce `lib/simple-debug.ts` utilities.
- `ec9fd1e` – **harden network config**: Keep guest view intact while hardening Sepolia RPC selection and error handling.
- `4ff6776` – **chore(debug)**: Add simple debug helpers for confirmations and balances, improving internal verification on Sepolia.

**Status**

- Network selection and RPC configuration are significantly more robust; future work is to **surface active network and testnet context more prominently in the UI** (banner + header).

---

#### 2.3 Guest mode, discovery, and education

**What testers said**

- Guest mode hid too much of the app—hard to understand value before connecting.
- New-to-DeFi testers lacked inline explanations of health factor, LTV, and risk.
- There was a strong desire for a concise **“How this works”** guide with screenshots.

**Underlying issues**

- Guest mode originally gated too much content; actions were not visibly disabled with explanations.
- No in-app link to a user guide or onboarding flow.

**Key commits that address this**

- `25b177c` – **feat(guest-mode)**: Add guest mode with view-only gating.
- `17916b5` – **feat(guest-mode)**: Show full views in guest mode while keeping actions disabled.
- `d2b166e` – **feat(welcome-experience)**: Move guest mode button to header and simplify welcome modal.
- `8051484` – **docs**: Add comprehensive user guide for Telegram Mini App.
- `961d5ba` – **docs**: Update user guide to recommend Telegram Web for best experience.
- `f0e8c8c` – **docs**: Add screenshots for clearer visual walkthroughs.

**Status**

- Guest mode now aligns with tester expectations: **full read-only views** with disabled actions.
- Documentation improvements and user guide provide an external educational layer; next step is to **connect this guide more visibly from the app shell**.

---

#### 2.4 Success flows and navigation (Supply)

**What testers said**

- After a successful supply, the dedicated success view felt like a **dead-end**; most expected to land back on the dashboard.

**Key commit**

- `7417dcf` – **feat(supply-success)**: Update supply page success modal to navigate to the dashboard.

**Status**

- Flow now matches user expectations: users see immediate portfolio impact on the dashboard after supply.

---

#### 2.5 Error handling, metadata, and assets

**What testers said**

- Some saw **generic framework errors** (e.g., invalid URL / Next.js-style screens) instead of a mini-app-friendly message.
- Image paths and icons occasionally broke in preview/static hosting setups, and a few testers hit metadata issues in non-production environments.

**Key commits that address this**

- `b7ec39e` – **fix(ssr)**: Guard `metadataBase` with a safe URL builder to avoid Invalid URL errors in dev/staging.
- `38242c2` – **fix(dev)**: Robust `metadataBase` guard (trim + scheme check) to prevent Invalid URL in Next dev.
- `26481fc` – **fix(assets)**: Fix all image paths for GitHub Pages compatibility.
- `0012cab` – **assets**: Update image paths to use `public/` prefix consistently.

**Status**

- The mini app is now significantly more resilient in dev, staging, and static hosting environments. Remaining work is on **custom error boundaries** and **consistent UX copy** around failures.

---

### 3. Quantitative snapshot (from survey)

- **Average ratings (1–10)**:
  - Overall experience: **8.0**
  - Wallet connection: **8.4**
  - Performance: **8.2**
  - Clarity of flows: **7.6**
  - Visual design: **8.6**
  - Stability: **7.6**




