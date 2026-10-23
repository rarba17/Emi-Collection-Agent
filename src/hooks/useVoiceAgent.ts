import { useCallback, useEffect, useRef, useState } from 'react'
import { CollectionsAgent } from '../agent/engine'
import { DEMO_PROFILE } from '../agent/profile'
import { SCENARIOS } from '../agent/scenarios'
import type { AgentAction, Speaker, Stage } from '../agent/types'

export type CallStatus = 'idle' | 'speaking' | 'thinking' | 'ready' | 'listening' | 'closed'
export type CallMode = 'auto' | 'live' | null

export interface UiTurn {
  id: number
  speaker: Speaker
  text: string
}

export interface UiAction extends AgentAction {
  id: number
}

interface RecognitionResult {
  isFinal: boolean
  [index: number]: { transcript: string }
}

interface RecognitionEvent {
  resultIndex: number
  results: {
    length: number
    [index: number]: RecognitionResult
  }
}

interface RecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type RecognitionCtor = new () => RecognitionLike

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

const formatVoice = (role: Speaker) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  const indian = voices.filter((voice) => voice.lang.toLowerCase() === 'en-in')
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'))

  if (role === 'customer') {
    return (
      indian.find((voice) => /prabhat|male|rishi/i.test(voice.name)) ??
      english.find((voice) => /daniel|alex|male/i.test(voice.name)) ??
      indian[1] ??
      english[1] ??
      indian[0] ??
      english[0] ??
      null
    )
  }

  return (
    indian.find((voice) => /neerja|female|heera/i.test(voice.name)) ??
    indian[0] ??
    english.find((voice) => /female|samantha|zira/i.test(voice.name)) ??
    english[0] ??
    null
  )
}

export function useVoiceAgent() {
  const [turns, setTurns] = useState<UiTurn[]>([])
  const [actions, setActions] = useState<UiAction[]>([])
  const [stage, setStage] = useState<Stage>('idle')
  const [status, setStatus] = useState<CallStatus>('idle')
  const [mode, setMode] = useState<CallMode>(null)
  const [speakingRole, setSpeakingRole] = useState<Speaker>('agent')
  const [seconds, setSeconds] = useState(0)
  const [started, setStarted] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [interim, setInterim] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [activeScenario, setActiveScenario] = useState<string | null>(null)

  const agentRef = useRef<CollectionsAgent | null>(null)
  const runIdRef = useRef(0)
  const turnIdRef = useRef(0)
  const actionIdRef = useRef(0)
  const recognitionRef = useRef<RecognitionLike | null>(null)
  const voiceEnabledRef = useRef(voiceEnabled)
  const micRequestedRef = useRef(false)

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled
  }, [voiceEnabled])

  useEffect(() => {
    if (!started || status === 'idle' || status === 'closed') return
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000)
    return () => window.clearInterval(timer)
  }, [started, status])

  useEffect(() => {
    return () => {
      runIdRef.current += 1
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      recognitionRef.current?.abort()
      micRequestedRef.current = false
    }
  }, [])

  const pushTurn = useCallback((speaker: Speaker, text: string) => {
    turnIdRef.current += 1
    const turn = { id: turnIdRef.current, speaker, text }
    setTurns((current) => [...current, turn])
    return turn
  }, [])

  const pushActions = useCallback((entries: AgentAction[]) => {
    if (!entries.length) return
    setActions((current) => [
      ...current,
      ...entries.map((entry) => {
        actionIdRef.current += 1
        return { ...entry, id: actionIdRef.current }
      }),
    ])
  }, [])

  const cancel = useCallback(() => {
    runIdRef.current += 1
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    recognitionRef.current?.abort()
    recognitionRef.current = null
    micRequestedRef.current = false
    setInterim('')
  }, [])

  const speak = useCallback(async (text: string, role: Speaker, runId: number) => {
    if (runIdRef.current !== runId) return
    setSpeakingRole(role)
    setStatus('speaking')

    if (!voiceEnabledRef.current || !('speechSynthesis' in window)) {
      await sleep(Math.min(3400, Math.max(800, text.length * 15)))
      return
    }

    await new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text)
      const voice = formatVoice(role)
      if (voice) utterance.voice = voice
      utterance.lang = voice?.lang ?? 'en-IN'
      utterance.rate = role === 'agent' ? 1.01 : 0.94
      utterance.pitch = role === 'agent' ? 1.02 : 0.82
      utterance.volume = 1

      let done = false
      let safety = 0
      const finish = () => {
        if (done) return
        done = true
        window.clearTimeout(safety)
        resolve()
      }

      utterance.onend = finish
      utterance.onerror = finish
      safety = window.setTimeout(finish, Math.min(30_000, Math.max(6_000, text.length * 115)))
      window.speechSynthesis.speak(utterance)
    })
  }, [])

  const reset = useCallback(() => {
    cancel()
    agentRef.current = null
    setTurns([])
    setActions([])
    setStage('idle')
    setStatus('idle')
    setMode(null)
    setSeconds(0)
    setStarted(false)
    setNotice(null)
    setActiveScenario(null)
    setSpeakingRole('agent')
  }, [cancel])

  const start = useCallback(
    async (slug: string, nextMode: Exclude<CallMode, null> = 'auto') => {
      const scenario = SCENARIOS.find((entry) => entry.slug === slug) ?? SCENARIOS[0]
      cancel()
      const runId = runIdRef.current

      const agent = new CollectionsAgent(DEMO_PROFILE)
      agentRef.current = agent
      turnIdRef.current = 0
      actionIdRef.current = 0
      setTurns([])
      setActions([])
      setStarted(true)
      setSeconds(0)
      setNotice(null)
      setInterim('')
      setMode(nextMode)
      setActiveScenario(scenario.slug)

      const opening = agent.start()
      setStage(opening.stage)
      pushTurn('agent', opening.text)
      await speak(opening.text, 'agent', runId)
      if (runIdRef.current !== runId) return

      if (nextMode === 'live') {
        setStatus('ready')
        return
      }

      for (const customerLine of scenario.turns) {
        await sleep(600)
        if (runIdRef.current !== runId) return

        pushTurn('customer', customerLine)
        await speak(customerLine, 'customer', runId)
        if (runIdRef.current !== runId) return

        setStatus('thinking')
        await sleep(380)
        if (runIdRef.current !== runId) return

        const reply = agent.respond(customerLine)
        setStage(reply.stage)
        pushTurn('agent', reply.text)
        pushActions(reply.actions)
        await speak(reply.text, 'agent', runId)
        if (runIdRef.current !== runId) return

        if (reply.end) {
          setStatus('closed')
          return
        }
      }

      setStatus('closed')
    },
    [cancel, pushActions, pushTurn, speak],
  )

  const send = useCallback(
    async (text: string) => {
      const agent = agentRef.current
      const clean = text.trim()
      if (!agent || !clean || status === 'thinking' || status === 'speaking' || status === 'closed') return

      const runId = runIdRef.current
      setNotice(null)
      setInterim('')
      pushTurn('customer', clean)
      setStatus('thinking')
      await sleep(320)
      if (runIdRef.current !== runId) return

      const reply = agent.respond(clean)
      setStage(reply.stage)
      pushTurn('agent', reply.text)
      pushActions(reply.actions)
      await speak(reply.text, 'agent', runId)
      if (runIdRef.current !== runId) return

      setStatus(reply.end ? 'closed' : 'ready')
    },
    [pushActions, pushTurn, speak, status],
  )

  const startListening = useCallback(() => {
    if (status !== 'ready') return
    const Recognition = (
      window as unknown as {
        SpeechRecognition?: RecognitionCtor
        webkitSpeechRecognition?: RecognitionCtor
      }
    ).SpeechRecognition ??
      (
        window as unknown as {
          webkitSpeechRecognition?: RecognitionCtor
        }
      ).webkitSpeechRecognition

    if (!Recognition) {
      setNotice('Voice input is not available in Brave. Type your reply instead.')
      return
    }

    recognitionRef.current?.abort()
    const recognition = new Recognition()
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => {
      setNotice(null)
      setInterim('')
      setStatus('listening')
    }

    recognition.onresult = (event) => {
      let finalText = ''
      let interimText = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        if (result.isFinal) finalText += result[0].transcript
        else interimText += result[0].transcript
      }
      setInterim(interimText)
      if (finalText.trim()) {
        recognition.stop()
        void send(finalText.trim())
      }
    }

    recognition.onerror = (event) => {
      recognitionRef.current = null
      if (event.error === 'not-allowed') {
        setNotice('Microphone permission is blocked in Brave. Type your reply instead.')
      } else if (event.error !== 'aborted') {
        setNotice('I could not hear that clearly. Try again or type your reply.')
      }
      setStatus((current) => (current === 'listening' ? 'ready' : current))
    }

    recognition.onend = () => {
      recognitionRef.current = null
      setInterim('')
      setStatus((current) => (current === 'listening' ? 'ready' : current))
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      setNotice('Voice input could not start in Brave. Type your reply instead.')
      setStatus('ready')
    }
  }, [send, status])

  const stopListening = useCallback(() => {
    micRequestedRef.current = false
    recognitionRef.current?.stop()
  }, [])

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((current) => !current)
  }, [])

  return {
    turns,
    actions,
    stage,
    status,
    mode,
    speakingRole,
    seconds,
    voiceEnabled,
    interim,
    notice,
    activeScenario,
    start,
    send,
    reset,
    startListening,
    stopListening,
    toggleVoice,
    isSpeechSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  }
}
