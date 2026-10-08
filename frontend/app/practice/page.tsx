'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Mic,
  Square,
  RotateCcw,
  Send,
  AlertCircle,
  Loader2,
  Volume2,
  Download,
  CheckCircle2,
  Settings2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Navbar } from '@/components/landing/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Waveform } from '@/components/waveform'
import { useAuth } from '@/components/auth/auth-context'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import {
  getSupportedMimeType,
  analyzeAudioBuffer,
  normalizeAudioBuffer,
  audioBufferToWav,
  playTestChime,
} from '@/lib/audio-utils'

// ─── Timer helper ────────────────────────────────────────────────────
function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ─── Inline Sign-In / Sign-Up Form ──────────────────────────────────
function InlineAuthForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (mode === 'signup') {
      const confirm = formData.get('confirm') as string
      if (password !== confirm) {
        setError('Passwords do not match.')
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      toast.success('Check your email for a confirmation link!')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    // Auth context will pick up the session change automatically
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="rounded-2xl border bg-card/70 p-6 shadow-xl shadow-primary/5 backdrop-blur-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-1.5 text-center">
          <h2 className="text-xl font-semibold tracking-tight">
            {mode === 'signin' ? 'Sign in to practice' : 'Create an account'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {mode === 'signin'
              ? 'You need to be signed in to record audio.'
              : 'Sign up to start your first practice session.'}
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="auth-email">Email</FieldLabel>
              <Input
                id="auth-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="auth-password">Password</FieldLabel>
              <Input
                id="auth-password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </Field>
            {mode === 'signup' && (
              <Field>
                <FieldLabel htmlFor="auth-confirm">Confirm Password</FieldLabel>
                <Input
                  id="auth-confirm"
                  name="confirm"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </Field>
            )}
            {error && <FieldError>{error}</FieldError>}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading
                ? mode === 'signin'
                  ? 'Signing in…'
                  : 'Creating account…'
                : mode === 'signin'
                  ? 'Sign In'
                  : 'Create Account'}
            </Button>
          </FieldGroup>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  setError(null)
                }}
                className="font-medium text-primary hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setError(null)
                }}
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

// ─── Audio Recorder ──────────────────────────────────────────────────
type RecState = 'ready' | 'recording' | 'processing' | 'review'

function AudioRecorder() {
  const [recState, setRecState] = useState<RecState>('ready')
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const [audioWarning, setAudioWarning] = useState<string | null>(null)
  const [audioDuration, setAudioDuration] = useState<number>(0)
  const [audioPeak, setAudioPeak] = useState<number>(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  // Live mic meter & visualizer
  const [liveLevels, setLiveLevels] = useState<number[]>(new Array(32).fill(0.1))
  const [liveVolume, setLiveVolume] = useState<number>(0)
  const [noAudioAlert, setNoAudioAlert] = useState(false)

  // Device enumeration
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [showDevicePicker, setShowDevicePicker] = useState(false)

  // Playback boost multiplier
  const [volumeBoost, setVolumeBoost] = useState<number>(1.0)
  const [isPlayingTestChime, setIsPlayingTestChime] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const silenceTimerRef = useRef<number>(0)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  // Enumerate audio input devices
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = allDevices.filter((d) => d.kind === 'audioinput')
      setDevices(audioInputs)
      if (audioInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(audioInputs[0].deviceId)
      }
    } catch {
      // ignore
    }
  }, [selectedDeviceId])

  useEffect(() => {
    refreshDevices()
  }, [refreshDevices])

  // Cleanup helper
  const cleanupRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecording()
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [cleanupRecording, audioUrl])

  // Start live analyser loop
  const startVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioCtx()
      audioContextRef.current = ctx

      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      analyser.smoothingTimeConstant = 0.65
      source.connect(analyser)
      analyserRef.current = analyser

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      silenceTimerRef.current = 0

      const updateMeter = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)

        // Calculate 32 visualizer bars
        const bars: number[] = []
        let sum = 0
        const step = Math.max(1, Math.floor(bufferLength / 32))

        for (let i = 0; i < 32; i++) {
          const val = dataArray[Math.min(i * step, bufferLength - 1)] / 255
          bars.push(Math.max(0.08, val))
          sum += val
        }

        const avg = sum / 32
        const volPercent = Math.min(100, Math.round(avg * 200))
        setLiveVolume(volPercent)
        setLiveLevels(bars)

        // If no audio is detected for more than 2 seconds of recording
        if (volPercent < 3) {
          silenceTimerRef.current += 1
          if (silenceTimerRef.current > 120) {
            // ~2 seconds at 60fps
            setNoAudioAlert(true)
          }
        } else {
          silenceTimerRef.current = 0
          setNoAudioAlert(false)
        }

        animFrameRef.current = requestAnimationFrame(updateMeter)
      }

      animFrameRef.current = requestAnimationFrame(updateMeter)
    } catch (e) {
      console.warn('AudioContext visualizer error:', e)
    }
  }

  // Start recording
  const startRecording = useCallback(async () => {
    setMicError(null)
    setAudioWarning(null)
    setNoAudioAlert(false)

    try {
      // 1. High-quality speech recording constraints
      // Notice: echoCancellation and noiseSuppression are disabled to prevent aggressive voice attenuation/muting on Windows
      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId
          ? {
              deviceId: { exact: selectedDeviceId },
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: true,
            }
          : {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: true,
            },
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch {
        // Fallback to basic audio constraint if specific parameters fail
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      }

      streamRef.current = stream

      // Refresh devices list so user sees actual device names now that permission is granted
      refreshDevices()

      // 2. Start real-time audio visualizer
      startVisualizer(stream)

      // 3. Configure MediaRecorder with best supported mimeType
      const mimeType = getSupportedMimeType()
      const options = mimeType ? { mimeType } : undefined
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setRecState('processing')

        // Stop visualizer and mic tracks
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current)
          animFrameRef.current = null
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }

        const rawType = mediaRecorder.mimeType || mimeType || 'audio/webm'
        const rawBlob = new Blob(chunksRef.current, { type: rawType })

        let finalBlob: Blob = rawBlob
        let durationSec = seconds
        let peakLevel = 0

        // 4. Decode audio buffer to analyze volume and normalize/boost quiet mics
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
          const decodeCtx = new AudioCtx()
          const arrayBuffer = await rawBlob.arrayBuffer()
          const decoded = await decodeCtx.decodeAudioData(arrayBuffer)

          durationSec = Math.round(decoded.duration)
          setAudioDuration(durationSec)

          const analysis = analyzeAudioBuffer(decoded)
          peakLevel = analysis.peak
          setAudioPeak(Math.round(analysis.peak * 100))

          if (analysis.isSilent) {
            setAudioWarning(
              'Notice: The recorded audio has very low or zero volume. Please check that your microphone is unmuted, properly selected, and turned up in your Windows Sound settings.',
            )
          }

          // Normalize/boost audio so quiet speech is crystal-clear and loud
          const normalized = normalizeAudioBuffer(decoded, decodeCtx, 0.92)

          // Convert to universal standard 16-bit PCM WAV (100% playable in all browsers)
          finalBlob = audioBufferToWav(normalized)

          await decodeCtx.close()
        } catch (decodeErr) {
          console.warn('Audio decoding fallback to raw blob:', decodeErr)
          finalBlob = rawBlob
        }

        // Revoke previous URL if any
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl)
        }

        const url = URL.createObjectURL(finalBlob)
        setAudioBlob(finalBlob)
        setAudioUrl(url)
        setRecState('review')
      }

      // 5. Start MediaRecorder with 100ms timeslice to ensure continuous chunk buffering
      mediaRecorder.start(100)
      setRecState('recording')
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError(
          'Microphone access was denied. Please allow microphone permissions in your browser URL bar and try again.',
        )
      } else if (err.name === 'NotFoundError') {
        setMicError('No microphone was detected on this device. Please plug in a microphone or headset.')
      } else {
        setMicError('Could not access microphone: ' + (err.message || 'Unknown device error.'))
      }
    }
  }, [selectedDeviceId, refreshDevices, seconds, audioUrl])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        // Request any remaining audio data before stopping
        mediaRecorderRef.current.requestData()
      } catch {
        // ignore
      }
      mediaRecorderRef.current.stop()
    }
  }, [])

  // Re-record
  const reRecord = useCallback(() => {
    cleanupRecording()
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setAudioBlob(null)
    setSeconds(0)
    setAudioDuration(0)
    setAudioPeak(0)
    setAudioWarning(null)
    setMicError(null)
    setNoAudioAlert(false)
    setVolumeBoost(1.0)
    setRecState('ready')
  }, [cleanupRecording, audioUrl])

  // Test speaker chime
  const handleTestSpeaker = async () => {
    setIsPlayingTestChime(true)
    await playTestChime()
    setIsPlayingTestChime(false)
    toast.info('Played test chime. If you heard two tones, your computer audio output is working!')
  }

  // Adjust playback boost
  const handleBoostChange = (boost: number) => {
    setVolumeBoost(boost)
    if (audioElementRef.current) {
      audioElementRef.current.volume = Math.min(1.0, boost)
    }
  }

  // Handle submit to AI
  const handleSubmit = useCallback(() => {
    toast.success('Audio submitted to AI for evaluation!', {
      description: 'Your recording was captured and processed successfully. ML backend integration coming soon.',
    })
  }, [])

  return (
    <div className="rounded-2xl border bg-card/60 p-6 backdrop-blur-sm sm:p-8">
      {/* Microphone permission or hardware error */}
      {micError && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-destructive">Microphone Access Error</span>
            <span className="text-xs text-muted-foreground">{micError}</span>
          </div>
        </div>
      )}

      {/* Device selection toggle */}
      {recState === 'ready' && devices.length > 0 && (
        <div className="mb-4 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDevicePicker(!showDevicePicker)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings2 className="size-3.5" />
            <span>
              Microphone: {devices.find((d) => d.deviceId === selectedDeviceId)?.label || 'Default microphone'}
            </span>
          </button>
          {showDevicePicker && (
            <div className="w-full max-w-sm rounded-lg border bg-background/80 p-3 shadow-sm">
              <label htmlFor="mic-select" className="block text-xs font-medium text-muted-foreground mb-1.5">
                Select Audio Input Device:
              </label>
              <select
                id="mic-select"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full rounded-md border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              >
                {devices.map((device, idx) => (
                  <option key={device.deviceId || idx} value={device.deviceId}>
                    {device.label || `Microphone ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* State 1 — Ready */}
        {recState === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-5 text-center"
          >
            <p className="text-sm font-medium text-muted-foreground">Ready to explain your approach?</p>
            <button
              type="button"
              onClick={startRecording}
              aria-label="Start Recording"
              className="group relative grid size-24 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <span className="absolute inset-0 rounded-full bg-primary/30 blur-md transition-opacity group-hover:opacity-80" />
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/20 [animation-duration:2.5s]" />
              <Mic className="relative size-9" />
            </button>
            <div className="flex flex-col items-center gap-1">
              <span className="text-base font-semibold">Start Recording</span>
              <span className="text-xs text-muted-foreground">
                Click the microphone button and talk clearly into your mic.
              </span>
            </div>

            {/* Test speaker button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestSpeaker}
                disabled={isPlayingTestChime}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Volume2 className="size-3.5" />
                {isPlayingTestChime ? 'Playing chime…' : 'Test computer audio output'}
              </button>
            </div>
          </motion.div>
        )}

        {/* State 2 — Recording */}
        {recState === 'recording' && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-5"
          >
            {/* Live Recording Badge with Live Input Level */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1">
                <span className="size-2 animate-pulse rounded-full bg-destructive" />
                <span className="text-xs font-medium text-destructive">Recording</span>
              </div>

              {/* Real-time Mic Signal Meter */}
              <div className="flex items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
                <Mic className="size-3 text-primary" />
                <span>Input: {liveVolume}%</span>
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    liveVolume > 5 ? 'bg-emerald-500' : 'bg-muted-foreground/40',
                  )}
                />
              </div>
            </div>

            {/* Live Timer */}
            <span className="font-mono text-3xl font-semibold tabular-nums">{formatTime(seconds)}</span>

            {/* Real Web Audio Live Frequency Waveform */}
            <div className="w-full max-w-md">
              <Waveform active levels={liveLevels} className="w-full" />
            </div>

            {/* Live silence warning if mic isn't picking up voice */}
            {noAudioAlert && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
                <AlertCircle className="size-4 shrink-0" />
                <span>No voice detected yet. Please speak into your microphone or check that it is unmuted.</span>
              </div>
            )}

            <Button variant="destructive" size="lg" onClick={stopRecording}>
              <Square data-icon="inline-start" />
              Stop Recording
            </Button>
          </motion.div>
        )}

        {/* State 2.5 — Processing Audio */}
        {recState === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 py-10"
          >
            <Loader2 className="size-8 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground">Processing & amplifying audio…</span>
            <span className="text-xs text-muted-foreground">Normalizing volume and preparing crystal-clear playback</span>
          </motion.div>
        )}

        {/* State 3 — Review */}
        {recState === 'review' && audioUrl && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-5 w-full max-w-lg mx-auto"
          >
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex items-center gap-2 rounded-full border bg-muted px-3 py-1">
                <CheckCircle2 className="size-3 text-emerald-500" />
                <span className="text-xs font-medium text-muted-foreground">
                  Recording captured · {formatTime(audioDuration || seconds)}
                </span>
              </div>
              {audioPeak > 0 && (
                <div className="rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                  Peak: {audioPeak}% (Boosted to 92%)
                </div>
              )}
            </div>

            {/* Low audio warning if applicable */}
            {audioWarning && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{audioWarning}</span>
              </div>
            )}

            {/* Standard HTML5 audio player */}
            <div className="w-full flex flex-col items-center gap-2 bg-card/80 p-4 rounded-xl border">
              <audio
                ref={audioElementRef}
                controls
                src={audioUrl}
                className="w-full rounded-lg"
                onLoadedMetadata={(e) => {
                  const audio = e.currentTarget
                  // Ensure volume is maximum
                  audio.volume = 1.0
                }}
              />

              {/* Volume Boost Controls & Download link */}
              <div className="flex flex-wrap items-center justify-between w-full pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="size-3.5 text-primary" />
                  <span>Playback Volume:</span>
                  <div className="flex gap-1">
                    {[
                      { label: '100%', val: 1.0 },
                      { label: '150%', val: 1.5 },
                      { label: '200%', val: 2.0 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => handleBoostChange(btn.val)}
                        className={cn(
                          'px-2 py-0.5 rounded text-[11px] font-medium transition-colors border',
                          volumeBoost === btn.val
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/50 hover:bg-muted text-muted-foreground border-transparent',
                        )}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {audioBlob && (
                  <a
                    href={audioUrl}
                    download="outloudai-practice.wav"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Download className="size-3" />
                    Download
                  </a>
                )}
              </div>
            </div>

            {/* Test speaker check */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Can&apos;t hear anything?</span>
              <button
                type="button"
                onClick={handleTestSpeaker}
                disabled={isPlayingTestChime}
                className="font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                <Volume2 className="size-3" />
                {isPlayingTestChime ? 'Testing…' : 'Test your speakers'}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={reRecord}>
                <RotateCcw data-icon="inline-start" />
                Re-record
              </Button>
              <Button size="sm" onClick={handleSubmit} className="gap-1.5">
                <Send className="size-3.5" />
                Submit to AI
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Practice Page ───────────────────────────────────────────────────
export default function PracticePage() {
  const { user, loading } = useAuth()

  return (
    <main className="relative min-h-screen bg-background">
      <Navbar />

      <div className="relative overflow-hidden pt-24 pb-12 sm:pt-32 sm:pb-16">
        {/* backgrounds */}
        <div className="pointer-events-none absolute inset-0 grid-bg mask-fade-edges opacity-70" />
        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="text-sm font-medium text-primary">Practice</p>
            <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
              Think out loud
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Record yourself explaining your approach. No coding — just clear, confident reasoning.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="mx-auto mt-10 max-w-2xl"
          >
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <Loader2 className="size-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading…</span>
              </div>
            ) : user ? (
              <AudioRecorder />
            ) : (
              <InlineAuthForm />
            )}
          </motion.div>
        </div>
      </div>
    </main>
  )
}
