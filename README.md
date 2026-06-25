# Navigating Down Markets

An **Investment Scenario Advisor** — a client-side web app that suggests asset allocations and concrete investment ideas based on macro conditions (policy rate, inflation, GDP, equity valuation, USD trend) and your personal risk profile and horizon. Supports both **Global** and **Türkiye** markets (TL instruments, BES, TÜFEX, gram gold, Eurobond funds, BIST equities, etc.).

The app runs entirely in your browser. No accounts, no API keys, no backend, no tracking. Nothing you enter is sent anywhere.

---

## Live site

Deployed via GitHub Pages: `https://<your-username>.github.io/navigating-down-markets/`

---

## How to use

1. Open the app.
2. Choose your **market**: Global or Türkiye.
3. Set the macro inputs:
   - **Policy rate** — central bank reference rate (TCMB for Türkiye, Fed/ECB for Global).
   - **Inflation (CPI)** — latest year-over-year reading.
   - **GDP growth** — current/expected real growth.
   - **Equity valuation** — cheap / fair / expensive (use CAPE, P/E vs. history as a guide).
   - **USD trend** — weak / neutral / strong (DXY direction).
4. Set your **personal profile**:
   - **Investment horizon** in years.
   - **Risk profile** — conservative / balanced / aggressive.
5. Read the output:
   - **Recommended allocation** across cash, bonds, credit, equities, REITs, gold, commodities, and (in some profiles) Bitcoin — plus TL-specific sleeves in Türkiye mode.
   - **Rationale bullets** explaining each tilt.
   - **Concrete ideas** — specific instruments or strategies that fit the regime.

Change any input to see the allocation update live. Use it to stress-test scenarios ("what if CPI drops to 20%?", "what if the Fed cuts?").

---

## Run locally

Requirements: [Bun](https://bun.sh) (or Node 20+).

```bash
bun install
bun run dev      # local dev server
bun run build    # production build into dist/
```

---

## Deploy

The repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and publishes to GitHub Pages on every push to `main`.

To enable:

1. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `main` (or run the workflow manually from the Actions tab).
3. Site goes live at `https://<your-username>.github.io/navigating-down-markets/`.

If you fork or rename the repo, update the `base` path in `vite.config.ts` to match the new repo name.

---

## Tech stack

React 18 · TypeScript · Vite · TanStack Router (SPA) · Tailwind CSS · shadcn/ui

---

## ⚠️ Legal Notice & Disclaimer

**This software is provided for educational and informational purposes only. It is NOT financial, investment, tax, accounting, or legal advice.**

- This application is a **computer program** that produces illustrative output based solely on the inputs you enter. It does not know your full financial situation, liabilities, tax residency, or objectives, and it cannot replace a licensed professional.
- The authors and contributors are **not licensed investment advisors, brokers, or financial planners** and are **not registered with**, **authorized by**, or **supervised by** any regulatory authority, including but not limited to **SPK / CMB (Türkiye)**, **SEC / FINRA (United States)**, **FCA (United Kingdom)**, **ESMA / national competent authorities under MiFID II (EU)**, **BaFin (Germany)**, **AMF (France)**, **CONSOB (Italy)**, **CySEC (Cyprus)**, **FINMA (Switzerland)**, **ASIC (Australia)**, **MAS (Singapore)**, **FSA / JFSA (Japan)**, or any other authority.
- Nothing displayed by this app constitutes a **solicitation**, **offer**, **recommendation**, or **endorsement** to buy, sell, hold, or transact in any security, fund, cryptocurrency, commodity, currency, derivative, pension product, or any other financial instrument.
- **Past performance is not indicative of future results.** All investments carry risk, including the **possible loss of principal**. Leveraged products, FX, crypto-assets, and emerging-market instruments can be especially volatile and may result in losses exceeding the amount invested.
- **You are solely responsible for your own investment decisions** and for any gains, losses, taxes, fees, or other consequences that result from them. You should consult an **independent, licensed financial advisor**, tax professional, and/or legal counsel in your jurisdiction before acting on any information shown by this app.
- The software is provided **"AS IS" and "AS AVAILABLE", without warranties of any kind**, express or implied, including but not limited to merchantability, fitness for a particular purpose, accuracy, completeness, timeliness, or non-infringement. Data, defaults, and assumptions used in the model may be outdated, incomplete, or incorrect.
- **To the maximum extent permitted by applicable law**, the authors, contributors, and any party associated with this project disclaim all liability for any direct, indirect, incidental, consequential, special, exemplary, or punitive damages — including loss of profits, data, capital, or opportunity — arising out of or related to your use of, or inability to use, this software.
- By using this application you **acknowledge and accept** that you have read, understood, and agreed to this disclaimer in full. If you do not agree, do not use the application.

---

## License

MIT. See `LICENSE` if present, or treat as MIT by default.
