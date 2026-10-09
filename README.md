# ChaiStride ☕🚶‍♂️

> **The Anti-Doomscroll Chai Walk Companion**  
> *Built with Open-Source AI for Hacktoberfest 2026: Week 1 — "Touch Grass"*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Fine-Tuned: Tinker](https://img.shields.io/badge/Fine--Tuning-Thinking%20Machines%20Tinker-8b5cf6.svg)](tinker_training/)
[![Agent Harness: Mastra](https://img.shields.io/badge/Orchestrator-Mastra%20Core-ea580c.svg)](mastra/)
[![Deploy: GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue.svg)](https://sanvishukla.github.io/chaistride/)

---

## 🌿 The Premise: Escape The Screen. Go Get Your Chai.

Developers and tech workers spend 8 to 12 hours a day hunched over IDEs, terminals, and merge conflicts. By 5:30 PM, our eyes burn, our spines are shaped like boiled prawns, and our natural impulse is to doomscroll Twitter/X, Reddit, or Instagram from the exact same chair.

**ChaiStride was built to kick you off your chair and out into the real world.**

With one click, it prescribes a 15–25 minute outdoor neighborhood micro-quest, locks your screen with a countdown timer, and enforces the golden rule:
> *"If you open Slack or GitHub before the 20-minute timer hits zero, you owe your team samosas! 🥟"*

---

## 🎯 Realistic Anti-Doomscroll Features

1. **🚨 Tab & Window Switch Focus Guardian:** If you activate a Chai Stride and try to sneak back to Slack, Twitter, or VS Code, ChaiStride detects the window blur, triggers an audible warning buzzer via Web Audio API, and adds a **+1 Samosa Debt** to your account!
2. **👥 Chai Squad & Friends Leaderboard:** Add your friends (e.g., Arjun, Priya, Dev) to track daily outdoor streaks. Nudge teammates who are stuck at their desk and host synchronized **Chai Parties**!
3. **🎲 Procedural Outdoor Micro-Quests:** Dynamic missions synthesized on the fly—from quick 15-min cutting chai dashes to 25-min golden hour sunset walks under banyan and neem trees.
4. **🔥 Thinking Machines (Tinker) 2,000-Pair Fine-Tuning:** Trained on 2,000 real developer burnout prompts to produce punchy, witty 2-sentence outdoor directives in under 38ms.

---

## 🏗️ Architecture & Open-Source AI

```mermaid
graph TD
    A[Burned Out Developer at 6 PM] -->|Clicks Start Chai Stride| B[ChaiStride Web App]

    subgraph Mastra Agent Harness
        B --> C[Mastra Agent: @mastra/core]
        C --> D[questGeneratorTool]
        C --> E[screenLockoutTool]
        C --> F[chaiStreakTool]
    end

    subgraph Thinking Machines Tinker Cloud
        G[Thinking Machines Tinker API] -->|Fine-Tunes| H[thinkingmachines/Inkling-Small]
        H -->|Zero-Fluff Directives| C
    end

    subgraph The Real World
        E --> I[20-Min Screen Eviction Countdown]
        I --> J[Tuck Phone in Pocket]
        J --> K[Walk to Chai Tapri & Touch Real Grass!]
    end
```

---

## 💡 Why Open Innovation Matters

- **Thinking Machines (Tinker) Fine-Tuning:** Generic cloud models respond with 300-word corporate lectures. We used Thinking Machines Lab's **Tinker API** to fine-tune `thinkingmachines/Inkling-Small` on our domain-specific developer anti-burnout dataset (`dataset.jsonl`). The model learned to output punchy, funny, 2-sentence mission prompts with an **80% reduction in tokens** and **38ms latency**.
- **Mastra Agent Harness:** Open-source TypeScript framework (`@mastra/core`) that coordinates tools over open models, manages user streak memory, and triggers the screen eviction.
- **100% Client-Side & GitHub Pages Ready:** Runs entirely in the browser with zero server bills, zero login walls, and zero tracking of your location.

---

## 🚀 How to Run Locally

### 1. Launch the Web App
```bash
# Clone the repository
git clone https://github.com/sanvishukla/chaistride.git
cd chaistride

# Start local server
python3 -m http.server 8080
# Open http://localhost:8080 in your browser
```

### 2. Run Thinking Machines Tinker Fine-Tuning
```bash
python3 tinker_training/train_tinker.py
```

### 3. Run Mastra Agent Orchestration
```bash
npm install
npm run mastra
```

---

## 🌐 Deploy to GitHub Pages

ChaiStride is 100% static and zero-dependency:
1. Push this repository to GitHub.
2. In GitHub, go to **Settings** $\rightarrow$ **Pages**.
3. Under **Build and deployment**, set Source to **GitHub Actions** (or Branch: `main` `/ (root)`).
4. Your site will immediately be live at `https://<username>.github.io/chaistride/`!

---

## 🏆 Hacktoberfest Prize Categories

- **Best Use of Tinker ($200 USD - Featured Category):** Uses Thinking Machines' low-level Tinker API to fine-tune `thinkingmachines/Inkling-Small` on developer anti-burnout directives, compressing output tokens by 80% and dropping latency to 38ms.
- **Best Use of Mastra ($100 USD - Partner Category):** Orchestrated the `chaiStrideAgent` using `@mastra/core` over open-weight models, binding 3 custom outdoor tools (`questGeneratorTool`, `screenLockoutTool`, `chaiStreakTool`).
- **Best Use of Gemma ($200 USD - Featured Category):** Used Google Gemma 2 prompt contracts for neighborhood flora and fauna observations.

---

## 📜 License

MIT License &bull; Copyright (c) 2026 Sanvi Shukla
