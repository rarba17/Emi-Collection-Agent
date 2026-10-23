# Ananya — Axis Collections Agent (Prototype)

A policy-first voice collections prototype for Axis Bank credit card EMI follow-up calls.

This project demonstrates how a debt collections agent can stay compliant, empathetic, and conversion-focused in early-stage delinquency scenarios.

## What this project includes

- **Live voice test studio** (browser speech input/output)
- **Deterministic collections policy engine** for repeatable behavior
- **7 scripted test scenarios** with automated checks
- **5 synthetic sample call recordings** (phone-band quality)
- **Production-oriented system prompt** in markdown
- **Success metrics + measurement framework**
- **10% → 20% conversion improvement plan** with hypotheses and experiments

## Tech stack

- React 19 + Vite 8 + TypeScript
- Custom CSS design system
- Vitest for scenario and regression testing
- Browser Web Speech APIs (`speechSynthesis`, `SpeechRecognition`)
- Python `edge-tts` + `ffmpeg` for sample recording generation

## Quick start

```bash
npm install
npm run dev
```

Open: `http://localhost:5173`

### Useful commands

```bash
npm run test    # run policy tests
npm run build   # production build
npm run preview # serve built app
npm run check   # typecheck + tests + build
```

## Project structure

- `src/agent/engine.ts` — collections policy/state machine
- `src/agent/scenarios.ts` — scripted scenarios
- `src/agent/testHarness.ts` — scenario runner
- `tests/agent.test.ts` — scenario integrity tests
- `tests/engine.regression.test.ts` — regression behavior tests
- `docs/agent-prompt.md` — production-style system prompt
- `src/data/strategy.ts` — metrics, measurement, conversion strategy
- `src/data/recordings.json` — recording metadata/transcripts/cues
- `public/audio/*.mp3` — generated sample recordings
- `scripts/generate_recordings.py` — recording generation script

## Generate / refresh sample recordings

Prerequisites:

- Python 3.10+
- `ffmpeg`
- `edge-tts`

Install and run:

```bash
pip install edge-tts
python3 scripts/generate_recordings.py
```

This regenerates:

- `public/audio/*.mp3`
- `src/data/recordings.json`

## What to test in the UI

1. Run a scripted scenario from the **Call Studio**
2. Run all scenarios in the **Test Lab**
3. Listen to sample calls in **Recordings**
4. Review metrics in **Measure**
5. Review conversion strategy in **Conversion**
6. Copy/download prompt in **System Prompt**

## Success metrics (high-level)

- 7-day cash conversion (north star)
- Kept-promise rate
- Right-party contact rate
- Resolution rate
- Cost per cure
- Policy defects + complaint guardrails
- Turn latency and handoff quality

Detailed definitions: `src/data/strategy.ts`

## Design and operating approach

### Prototype layer (this repo)

- Uses synthetic data and deterministic policy logic
- Optimized for repeatability, auditability, and demonstration

### Production target (not fully implemented here)

- LLM orchestrator + policy checks
- Telephony + ASR/TTS runtime
- Payment/CRM tool integrations
- Event ledger + payment-ledger measurement loop

## Browser note

Voice features depend on browser speech APIs and permissions.

- Chrome is the most reliable for live speech testing.
- Brave may show intermittent speech recognition behavior depending on privacy settings.
- If speech input is unstable, use typed responses in live mode.

## Important disclaimer

This is an independent prototype for demonstration and testing only.

- No real customer data is used.
- No live bank systems are connected.
- Synthetic recordings and test scenarios are used throughout.

## Additional docs

- Project intro script: `docs/project-introduction.md`
- System prompt: `docs/agent-prompt.md`
