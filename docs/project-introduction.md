# Ananya — Project Introduction Script

## 01 · What is this project?

Ananya is a voice AI collections agent built as a working prototype for **early-stage Axis Bank credit card collections**.

It is designed for the moment a customer has missed an EMI payment and the bank needs to speak with them — respectfully, and with policy guardrails — before the debt becomes a problem.

The agent walks through four steps in every call:

1. **Verify the speaker** before disclosing any account information.
2. **Understand the reason** behind the missed payment.
3. **Resolve** with one of three next steps: payment, a dated promise to pay, or a specialist callback.
4. **Close** the call with a recorded outcome.

The goal is not to collect every rupee. The goal is to leave the customer with a clear next step they can actually take.

---

## 02 · Architecture at a glance

There are two layers in the prototype.

**The browser demo** is a deterministic voice interface. It uses Web Speech APIs for voice input and output, and a policy engine on top of the conversation state to keep the call compliant and repeatable.

**The production architecture** is intentionally separate. Ananya is not directly embedded here; the real deployment would use:

- an LLM-driven conversational agent,
- a speech-to-text / text-to-speech runtime,
- a bank account API,
- a CRM / payment / collections tool surface,
- a compliance layer that logs every turn, consent flag, and action.

The prototype purposefully keeps the bank-facing data synthetic. The project is testable, auditable, and easy to redesign without touching bank systems.

---

## 03 · What kinds of debt-collection scenarios can this agent handle?

In real life, collections conversations rarely stay on one track. A few common ones this design anticipates:

- **Salary delayed or partly available.**
  The customer wants to pay, but not the full EMI today. The agent offers a split: a part payment now, and the rest on a dated promise.

- **Hardship or loss of income.**
  Job loss, medical emergency, bereavement. The agent stops the pressure and routes the call to a specialist instead of asking for money.

- **Payment already made.**
  The bank may not know. The agent pauses reminders, avoids double-collection, and opens a payment trace.

- **Dispute or fraud.**
  The customer says a charge isn't theirs. The agent pauses collections immediately and routes to the dispute team.

- **Wrong number.**
  The person on the phone is not the account holder. The agent discloses nothing and closes safely.

- **Do-not-call request.**
  The customer asks to stop contact. The agent honours the request immediately, logs the suppression, and does not attempt retention.

- **Temporary cash-flow crunch.**
  The customer isn't currently in hardship, but has a specific salary date. The agent schedules a respectful callback.

Together, these cover the calls where a hard-coded script would fail: the real call needs judgement, not repetition.

---

## 04 · Why we built this this way

A voice model without a policy engine is not safe for collections. The same sentence can be a payment plan, a hardship disclosure, or a scam signal depending on what the customer really means.

So the agent is built as:

- **documented prompt rules** that the production agent must follow,
- **policy-driven code** in the demo that is deterministic and testable,
- **structured actions** with a ledger of what the call produced,
- **synthetic data** so we can demo the behaviour without touching real customers.

The point is not to replace a human agent. It is to make sure that every call, no matter how emotional, still ends with a fair next step and an accurate record.
