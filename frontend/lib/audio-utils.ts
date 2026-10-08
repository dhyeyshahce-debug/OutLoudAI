/**
 * Audio utilities for OutLoudAI
 * - Supported MIME type detection for MediaRecorder
 * - AudioBuffer normalization (boosts quiet mic input)
 * - AudioBuffer to WAV Blob conversion (100% compatible across all browsers)
 * - Silence / volume analysis
 * - Test chime for speaker verification
 */

export function getSupportedMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return 'audio/webm'
  }

  const candidateTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
    'audio/aac',
  ]

  for (const type of candidateTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }

  return ''
}

/**
 * Checks if the audio buffer has audible content or is silence
 */
export function analyzeAudioBuffer(buffer: AudioBuffer): {
  peak: number
  rms: number
  isSilent: boolean
} {
  const numChannels = buffer.numberOfChannels
  let maxPeak = 0
  let sumSquares = 0
  let totalSamples = 0

  for (let c = 0; c < numChannels; c++) {
    const data = buffer.getChannelData(c)
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i])
      if (abs > maxPeak) maxPeak = abs
      sumSquares += data[i] * data[i]
      totalSamples++
    }
  }

  const rms = totalSamples > 0 ? Math.sqrt(sumSquares / totalSamples) : 0
  // Peak < 0.01 or RMS < 0.002 is essentially silence
  const isSilent = maxPeak < 0.015

  return { peak: maxPeak, rms, isSilent }
}

/**
 * Boosts/normalizes audio if the mic input was quiet, ensuring it's clearly audible
 */
export function normalizeAudioBuffer(
  buffer: AudioBuffer,
  audioContext: AudioContext,
  targetPeak: number = 0.9,
): AudioBuffer {
  const numChannels = buffer.numberOfChannels
  let maxPeak = 0

  for (let c = 0; c < numChannels; c++) {
    const data = buffer.getChannelData(c)
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i])
      if (abs > maxPeak) maxPeak = abs
    }
  }

  // If already loud enough or pure silence, return as-is
  if (maxPeak === 0 || maxPeak >= targetPeak || maxPeak < 0.005) {
    return buffer
  }

  const gain = Math.min(targetPeak / maxPeak, 10.0) // cap gain boost at 10x (+20dB)
  const normalized = audioContext.createBuffer(
    numChannels,
    buffer.length,
    buffer.sampleRate,
  )

  for (let c = 0; c < numChannels; c++) {
    const sourceData = buffer.getChannelData(c)
    const destData = normalized.getChannelData(c)
    for (let i = 0; i < sourceData.length; i++) {
      destData[i] = Math.max(-1, Math.min(1, sourceData[i] * gain))
    }
  }

  return normalized
}

/**
 * Converts an AudioBuffer into a standard 16-bit PCM WAV Blob.
 * Universally playable in all browsers and audio players without container/codec issues.
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const channelData: Float32Array[] = []
  for (let i = 0; i < numChannels; i++) {
    channelData.push(buffer.getChannelData(i))
  }

  const numSamples = buffer.length * numChannels
  const bufferBytes = new ArrayBuffer(44 + numSamples * 2)
  const view = new DataView(bufferBytes)

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + numSamples * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true)
  view.setUint16(32, numChannels * (bitDepth / 8), true)
  view.setUint16(34, bitDepth, true)
  writeString(36, 'data')
  view.setUint32(40, numSamples * 2, true)

  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channelData[c][i]
      sample = Math.max(-1, Math.min(1, sample))
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      view.setInt16(offset, intSample, true)
      offset += 2
    }
  }

  return new Blob([view], { type: 'audio/wav' })
}

/**
 * Plays a pleasant 2-tone chime to test browser audio output
 */
export function playTestChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) {
        resolve()
        return
      }
      const ctx = new AudioCtx()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const now = ctx.currentTime

      // First tone (523.25 Hz - C5)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(523.25, now)
      gain1.gain.setValueAtTime(0, now)
      gain1.gain.linearRampToValueAtTime(0.2, now + 0.05)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.35)

      // Second tone (659.25 Hz - E5)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(659.25, now + 0.15)
      gain2.gain.setValueAtTime(0, now + 0.15)
      gain2.gain.linearRampToValueAtTime(0.25, now + 0.2)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.15)
      osc2.stop(now + 0.6)

      setTimeout(() => {
        ctx.close()
        resolve()
      }, 700)
    } catch {
      resolve()
    }
  })
}
