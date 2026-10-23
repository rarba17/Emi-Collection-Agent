import { useRef, useState, type CSSProperties } from 'react'
import { ChevronDown, Download, Pause, Play } from 'lucide-react'
import rawRecordings from '../data/recordings.json'

interface Cue {
  speaker: 'agent' | 'customer'
  text: string
  start: number
  end: number
}

interface Recording {
  slug: string
  title: string
  context: string
  outcome: string
  outcomeTone: string
  summary: string
  audio: string
  duration: number
  turns: Cue[]
}

const recordings = rawRecordings as Recording[]

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

function RecordingCard({ recording, index }: { recording: Recording; index: number }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(recording.duration)
  const [showTranscript, setShowTranscript] = useState(false)

  const activeCue =
    recording.turns.find((cue) => current >= cue.start && current <= cue.end) ??
    [...recording.turns].reverse().find((cue) => current >= cue.start) ??
    recording.turns[0]

  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      void audio.play()
    }
  }

  const seek = (value: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value
    setCurrent(value)
  }

  return (
    <article className={`recording-card ${index === 0 ? 'is-featured' : ''}`}>
      <div className="recording-head">
        <span className="mono-label">RECORDING {String(index + 1).padStart(2, '0')}</span>
        <span className={`outcome-chip ${recording.outcomeTone}`}>{recording.outcome}</span>
      </div>

      <div className="recording-title-row">
        <div>
          <p className="recording-context">{recording.context}</p>
          <h3>{recording.title}</h3>
        </div>
        <span className="recording-duration">{formatTime(duration)}</span>
      </div>

      <p className="recording-summary">{recording.summary}</p>

      <div className="player">
        <button
          className="play-button"
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause ${recording.title}` : `Play ${recording.title}`}
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>

        <div className="player-main">
          <div className="player-wave" aria-hidden="true">
            {Array.from({ length: 48 }).map((_, bar) => (
              <span
                key={bar}
                style={{
                  height: `${18 + ((bar * 23) % 58)}%`,
                  opacity: (bar / 48) * 100 <= progress ? 1 : 0.24,
                }}
              />
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.05}
            value={current}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label={`Seek through ${recording.title}`}
            style={{ '--progress': `${progress}%` } as CSSProperties}
          />
          <div className="player-times">
            <span>{formatTime(current)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <a className="download-button" href={recording.audio} download aria-label={`Download ${recording.title} MP3`}>
          <Download size={15} />
        </a>
      </div>

      <div className="live-caption">
        <span className="mono-label">{playing ? 'LIVE CAPTION' : current > 0 ? 'PAUSED AT' : 'PREVIEW'}</span>
        <p>
          <span>{activeCue.speaker === 'agent' ? 'ANANYA' : 'CUSTOMER'}</span>
          {activeCue.text}
        </p>
      </div>

      <button
        className="transcript-toggle"
        type="button"
        onClick={() => setShowTranscript((value) => !value)}
        aria-expanded={showTranscript}
      >
        {showTranscript ? 'Hide transcript' : 'Read full transcript'}
        <ChevronDown size={14} className={showTranscript ? 'rotated' : ''} />
      </button>

      {showTranscript && (
        <div className="recording-transcript">
          {recording.turns.map((cue, cueIndex) => (
            <div
              className={`recording-turn ${cue.speaker} ${cue === activeCue ? 'is-active' : ''}`}
              key={`${recording.slug}-${cueIndex}`}
            >
              <span>{cue.speaker === 'agent' ? 'ANANYA' : 'CUSTOMER'}</span>
              <p>{cue.text}</p>
            </div>
          ))}
        </div>
      )}

      <audio
        ref={audioRef}
        src={recording.audio}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setCurrent(0)
        }}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const nextDuration = event.currentTarget.duration
          if (Number.isFinite(nextDuration)) setDuration(nextDuration)
        }}
      />
    </article>
  )
}

export function Recordings() {
  const total = recordings.reduce((sum, recording) => sum + recording.duration, 0)

  return (
    <section className="recordings-section" aria-labelledby="recordings-title">
      <div className="page-width">
        <div className="recordings-head">
          <div>
            <p className="section-kicker">SAMPLE CALLS / LISTEN IN</p>
            <h2 id="recordings-title">{recordings.length} calls, in full.</h2>
          </div>
          <div className="recordings-meta">
            <span>{recordings.length.toString().padStart(2, '0')} calls</span>
            <span>{formatTime(total)} total</span>
            <span>Synthetic · phone-band</span>
          </div>
        </div>

        <div className="recordings-grid">
          {recordings.map((recording, index) => (
            <RecordingCard recording={recording} index={index} key={recording.slug} />
          ))}
        </div>

        <p className="recordings-disclaimer">
          Generated with synthetic Indian English voices for this prototype. Scripted for reproducibility. No real
          customer, account or call is represented.
        </p>
      </div>
    </section>
  )
}
