#!/usr/bin/env python3
"""Generate the five scenario calls used in the test lab.

Requires edge-tts and ffmpeg. The generated audio is synthetic, phone-band
quality, and contains no real customer data. Run from the project root:

    python3 scripts/generate_recordings.py
"""

from __future__ import annotations

import asyncio
import json
import subprocess
import tempfile
import wave
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "public" / "audio"
DATA_FILE = ROOT / "src" / "data" / "recordings.json"

AGENT_VOICE = "en-IN-NeerjaExpressiveNeural"
CALLER_A_VOICE = "en-IN-PrabhatNeural"
CALLER_B_VOICE = "en-IN-NeerjaNeural"

SAMPLE_RATE = 24_000
TURN_GAP_MS = 420
LEAD_MS = 240
TAIL_MS = 620

AF = "highpass=f=300,lowpass=f=3400,acompressor=threshold=-19dB:ratio=2,aresample=24000,loudnorm=I=-17:TP=-1.5:LRA=9"

CALLS = [
    {
        "slug": "salary-delay",
        "title": "Salary delay → split promise",
        "context": "Early collections · 12 DPD",
        "outcome": "Promise to pay",
        "outcomeTone": "good",
        "summary": "Rohan can pay part today and the rest after salary. The agent captures a dated promise, sends the UPI link and schedules a reminder.",
        "voice": CALLER_A_VOICE,
        "turns": [
            ("agent", "Namaste, I'm Ananya, Axis Bank's A I assistant. This call is recorded. Am I speaking with Mr. Mehta?", "Namaste, I'm Ananya, Axis Bank's AI assistant. This call is recorded. Am I speaking with Mr. Mehta?"),
            ("customer", "Yes, Rohan speaking.", "Yes, Rohan speaking."),
            ("agent", "Thank you. To protect your account, could you confirm the last four digits of the P A N registered with us?", "Thank you. To protect your account, could you confirm the last four digits of the PAN registered with us?"),
            ("customer", "The last four digits are four, eight, two, one.", "The last four digits are 4 8 2 1."),
            ("agent", "Thank you. Your E M I of seven thousand eight hundred and forty rupees was due on eleventh October and is now twelve days overdue. I'm calling to help you clear it or find a plan. What's making it difficult to pay?", "Thank you. Your EMI of ₹7,840 was due on 11 October and is now 12 days overdue. I'm calling to help you clear it or find a plan. What's making it difficult to pay?"),
            ("customer", "My salary is delayed this month, so I can't clear the full E M I today.", "My salary is delayed this month, so I can't clear the full EMI today."),
            ("agent", "I understand. Salary timing can make a clean payment hard. Would it help to split it: a part payment today, and the rest on twenty-seventh October?", "I understand. Salary timing can make a clean payment hard. Would it help to split it: a part payment today, and the rest on 27 October?"),
            ("customer", "I can pay four thousand rupees today, and the rest on the twenty-seventh.", "I can pay ₹4,000 today, and the rest on the 27th."),
            ("agent", "That works. I can send a secure U P I link for four thousand rupees now, and set the remaining three thousand eight hundred and forty rupees for twenty-seventh October. I'll also send a reminder twenty-four hours before. Would you like the link on WhatsApp?", "That works. I can send a secure UPI link for ₹4,000 now, and set the remaining ₹3,840 for 27 October. I'll also send a reminder 24 hours before. Would you like the link on WhatsApp?"),
            ("customer", "Yes, WhatsApp is fine.", "Yes, WhatsApp is fine."),
            ("agent", "Done. I've noted four thousand rupees today and three thousand eight hundred and forty rupees by twenty-seventh October. I'm sending the secure U P I link and a WhatsApp confirmation now, with a reminder twenty-four hours before. Is there anything else I can help with?", "Done. I've noted ₹4,000 today and ₹3,840 by 27 October. I'm sending the secure UPI link and a WhatsApp confirmation now, with a reminder 24 hours before. Is there anything else I can help with?"),
            ("customer", "No, that's all. Thank you.", "No, that's all. Thank you."),
            ("agent", "Thank you, Mr. Mehta. I appreciate your time. Goodbye.", "Thank you, Mr. Mehta. I appreciate your time. Goodbye."),
        ],
    },
    {
        "slug": "hardship",
        "title": "Job loss → hardship handoff",
        "context": "Financial hardship · do not pressure",
        "outcome": "Specialist handoff",
        "outcomeTone": "warm",
        "summary": "Meera has lost her job. The agent stops payment pressure, explains the next step and books a specialist callback at 5 pm.",
        "voice": CALLER_B_VOICE,
        "turns": [
            ("agent", "Namaste, I'm Ananya, Axis Bank's A I assistant. This call is recorded. Am I speaking with Ms. Nair?", "Namaste, I'm Ananya, Axis Bank's AI assistant. This call is recorded. Am I speaking with Ms. Nair?"),
            ("customer", "Yes, Meera speaking.", "Yes, Meera speaking."),
            ("agent", "Thank you. To protect your account, could you confirm the last four digits of the P A N registered with us?", "Thank you. To protect your account, could you confirm the last four digits of the PAN registered with us?"),
            ("customer", "Four, eight, two, one.", "4 8 2 1."),
            ("agent", "Thank you. Your E M I of twelve thousand four hundred and fifty rupees was due on ninth October and is now fourteen days overdue. I'm calling to help you clear it or find a plan. What's making it difficult to pay?", "Thank you. Your EMI of ₹12,450 was due on 9 October and is now 14 days overdue. I'm calling to help you clear it or find a plan. What's making it difficult to pay?"),
            ("customer", "I lost my job last month. I can't afford the E M I right now.", "I lost my job last month. I can't afford the EMI right now."),
            ("agent", "I'm sorry you're going through that. I won't push for a payment today. I can connect you with a specialist who can check E M I restructuring or a suitable plan. Would a callback today at five p m work?", "I'm sorry you're going through that. I won't push for a payment today. I can connect you with a specialist who can check EMI restructuring or a suitable plan. Would a callback today at 5 pm work?"),
            ("customer", "Yes, five p m works.", "Yes, 5 pm works."),
            ("agent", "Thank you. I've arranged a callback for five p m today. A specialist will review E M I restructuring and other options with you. I've paused automated reminders in the meantime. Take care.", "Thank you. I've arranged a callback for 5 pm today. A specialist will review EMI restructuring and other options with you. I've paused automated reminders in the meantime. Take care."),
        ],
    },
    {
        "slug": "already-paid",
        "title": "Payment already made → trace opened",
        "context": "Payment trace · verification requested",
        "outcome": "Payment trace",
        "outcomeTone": "steady",
        "summary": "Neha has already paid yesterday through UPI. The agent pauses reminders, avoids a duplicate payment request, and sends a verification prompt.",
        "voice": CALLER_A_VOICE,
        "turns": [
            ("agent", "Namaste, I'm Ananya, Axis Bank's A I assistant. This call is recorded. Am I speaking with Ms. Vasanth?", "Namaste, I'm Ananya, Axis Bank's AI assistant. This call is recorded. Am I speaking with Ms. Vasanth?"),
            ("customer", "Yes, speaking.", "Yes, speaking."),
            ("agent", "Thank you. For account security, could you confirm the last four digits of the P A N registered with us?", "Thank you. For account security, could you confirm the last four digits of the PAN registered with us?"),
            ("customer", "Four, eight, two, one.", "4 8 2 1."),
            ("agent", "Thank you. Your E M I of nine thousand three hundred rupees was due on eighth October and is now eighteen days overdue. I'm calling to help you clear it or find a plan. What's making it difficult to pay?", "Thank you. Your EMI of ₹9,300 was due on 8 October and is now 18 days overdue. I'm calling to help you clear it or find a plan. What's making it difficult to pay?"),
            ("customer", "Actually I already paid it yesterday through U P I.", "Actually, I already paid it yesterday through UPI."),
            ("agent", "Thank you. When did you pay, and do you have the payment reference handy?", "Thank you. When did you pay, and do you have the payment reference handy?"),
            ("customer", "I paid yesterday. I don't have the reference handy.", "I paid yesterday. I don't have the reference handy."),
            ("agent", "No problem. I'll pause reminders while the payment is traced. If it doesn't reflect within forty-eight hours, reply to the SMS with your payment reference. I'm sending a confirmation on WhatsApp now. Anything else?", "No problem. I'll pause reminders while the payment is traced. If it doesn't reflect within 48 hours, reply to the SMS with your payment reference. I'm sending a confirmation on WhatsApp now. Anything else?"),
            ("customer", "No, thank you.", "No, thank you."),
            ("agent", "Thank you, Ms. Vasanth. I appreciate your time. Goodbye.", "Thank you, Ms. Vasanth. I appreciate your time. Goodbye."),
        ],
    },
    {
        "slug": "dispute",
        "title": "Disputed charge → collections paused",
        "context": "Dispute flow · specialist handoff",
        "outcome": "Dispute handoff",
        "outcomeTone": "steady",
        "summary": "Priya says the transaction was not hers. The agent pauses collections on the disputed amount and routes the case to a specialist.",
        "voice": CALLER_B_VOICE,
        "turns": [
            ("agent", "Namaste, I'm Ananya, Axis Bank's A I assistant. This call is recorded. Am I speaking with Ms. Ramachandran?", "Namaste, I'm Ananya, Axis Bank's AI assistant. This call is recorded. Am I speaking with Ms. Ramachandran?"),
            ("customer", "Yes, speaking.", "Yes, speaking."),
            ("agent", "Thank you. Could you confirm the last four digits of the P A N registered with us?", "Thank you. Could you confirm the last four digits of the PAN registered with us?"),
            ("customer", "Four, eight, two, one.", "4 8 2 1."),
            ("agent", "Thank you. Your E M I of six thousand eight hundred rupees was due on ninth October and is now fourteen days overdue. I'm calling to help you clear it or find a plan. What's making it difficult to pay?", "Thank you. Your EMI of ₹6,800 was due on 9 October and is now 14 days overdue. I'm calling to help you clear it or find a plan. What's making it difficult to pay?"),
            ("customer", "I don't recognise this charge. I want to dispute it. The transaction was on the ninth.", "I don't recognise this charge. I want to dispute it. The transaction was on the 9th."),
            ("agent", "I understand. I'll pause collections on the disputed amount and route the case to a specialist. Please don't share card details with anyone. A specialist will call you within one working day. Anything else?", "I understand. I'll pause collections on the disputed amount and route the case to a specialist. Please don't share card details with anyone. A specialist will call you within one working day. Anything else?"),
            ("customer", "No, that's all.", "No, that's all."),
            ("agent", "Thank you, Ms. Ramachandran. Goodbye.", "Thank you, Ms. Ramachandran. Goodbye."),
        ],
    },
    {
        "slug": "dnc",
        "title": "Do-not-call → number suppressed",
        "context": "DNC request · immediate suppression",
        "outcome": "DNC recorded",
        "outcomeTone": "warning",
        "summary": "Sanjay asks for no more calls. The agent honours the request immediately, with no retention script and no further pressure.",
        "voice": CALLER_A_VOICE,
        "turns": [
            ("agent", "Namaste, I'm Ananya, Axis Bank's A I assistant. This call is recorded. Am I speaking with Mr. Bhandari?", "Namaste, I'm Ananya, Axis Bank's AI assistant. This call is recorded. Am I speaking with Mr. Bhandari?"),
            ("customer", "Yes, speaking.", "Yes, speaking."),
            ("agent", "Thank you. Could you confirm the last four digits of the P A N registered with us?", "Thank you. Could you confirm the last four digits of the PAN registered with us?"),
            ("customer", "Four, eight, two, one.", "4 8 2 1."),
            ("agent", "Thank you. Your E M I of five thousand rupees was due on sixteenth October and is now seven days overdue. I'm calling to help you clear it or find a plan. What's making it difficult to pay?", "Thank you. Your EMI of ₹5,000 was due on 16 October and is now 7 days overdue. I'm calling to help you clear it or find a plan. What's making it difficult to pay?"),
            ("customer", "Stop calling me. Put me on your do-not-call list.", "Stop calling me. Put me on your do-not-call list."),
            ("agent", "Understood. I'm recording your request now and will stop collection calls to this number. You won't need to repeat it. Thank you.", "Understood. I'm recording your request now and will stop collection calls to this number. You won't need to repeat it. Thank you."),
        ],
    },
]


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


async def synth(text: str, voice: str, dest: Path, rate: str) -> None:
    communicator = edge_tts.Communicate(text=text, voice=voice, rate=rate)
    await communicator.save(str(dest))


def wav_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as handle:
        return handle.getnframes() / handle.getframerate()


def silence_wav(path: Path, milliseconds: int) -> None:
    frames = int(SAMPLE_RATE * milliseconds / 1000)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(SAMPLE_RATE)
        handle.writeframes(b"\x00\x00" * frames)


def concat_wavs(parts: list[Path], dest: Path) -> float:
    with wave.open(str(dest), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        for part in parts:
            with wave.open(str(part), "rb") as source:
                output.writeframes(source.readframes(source.getnframes()))
    return wav_duration(dest)


async def build_call(call: dict, work: Path) -> dict:
    parts: list[Path] = []
    cues: list[dict] = []
    silence_wav(work / "lead.wav", LEAD_MS)
    silence_wav(work / "gap.wav", TURN_GAP_MS)
    silence_wav(work / "tail.wav", TAIL_MS)
    parts.append(work / "lead.wav")
    elapsed = LEAD_MS / 1000

    for index, (speaker, speech, display) in enumerate(call["turns"]):
        mp3 = work / f"turn-{index:02d}.mp3"
        wav = work / f"turn-{index:02d}.wav"
        voice = AGENT_VOICE if speaker == "agent" else call["voice"]
        rate = "+4%" if speaker == "agent" else "+0%"
        await synth(speech, voice, mp3, rate)
        run(["ffmpeg", "-y", "-i", str(mp3), "-ar", str(SAMPLE_RATE), "-ac", "1", str(wav)])
        duration = wav_duration(wav)
        start = elapsed
        end = start + duration
        cues.append({"speaker": speaker, "text": display, "start": round(start, 2), "end": round(end, 2)})
        parts.append(wav)
        if index < len(call["turns"]) - 1:
            parts.append(work / "gap.wav")
            elapsed = end + TURN_GAP_MS / 1000
        else:
            elapsed = end

    parts.append(work / "tail.wav")
    master = work / "master.wav"
    total = concat_wavs(parts, master)
    out = AUDIO_DIR / f"{call['slug']}.mp3"
    run([
        "ffmpeg", "-y", "-i", str(master),
        "-af", AF,
        "-ar", str(SAMPLE_RATE), "-ac", "1", "-b:a", "64k", str(out),
    ])
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out)],
        stdout=subprocess.PIPE,
        text=True,
        check=True,
    ).stdout.strip()
    rendered_duration = float(probe.splitlines()[0])
    return {
        "slug": call["slug"],
        "title": call["title"],
        "context": call["context"],
        "outcome": call["outcome"],
        "outcomeTone": call["outcomeTone"],
        "summary": call["summary"],
        "audio": f"/audio/{call['slug']}.mp3",
        "duration": round(rendered_duration, 2),
        "turns": cues,
    }


async def main() -> None:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    rendered = []
    for call in CALLS:
        print(f"Generating {call['slug']}...")
        with tempfile.TemporaryDirectory(prefix="axis-call-") as tmp:
            rendered.append(await build_call(call, Path(tmp)))
    DATA_FILE.write_text(json.dumps(rendered, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {DATA_FILE}")
    for item in rendered:
        print(f"  {item['slug']}: {item['duration']:.1f}s → {item['audio']}")


if __name__ == "__main__":
    asyncio.run(main())
