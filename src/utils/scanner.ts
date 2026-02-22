export interface ScannerSettings {
  mode: 'usb' | 'camera' | 'both'
  cameraId: string
  sound: boolean
  autoAdd: boolean
  rapidMs: number
}

export const DEFAULT_SCANNER_SETTINGS: ScannerSettings = {
  mode: 'usb',
  cameraId: '',
  sound: true,
  autoAdd: true,
  rapidMs: 50
}

export function parseScannerSettings(data: Record<string, string>): ScannerSettings {
  const mode = data.scanner_mode as ScannerSettings['mode']
  return {
    mode: mode === 'camera' || mode === 'both' ? mode : 'usb',
    cameraId: data.scanner_camera_id || '',
    sound: data.scanner_sound !== 'false',
    autoAdd: data.scanner_auto_add !== 'false',
    rapidMs: Math.max(20, Math.min(150, parseInt(data.scanner_rapid_ms, 10) || 50))
  }
}

export function playBeep(): void {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.type = 'square'
    oscillator.frequency.value = 1800
    gain.gain.value = 0.15
    oscillator.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    oscillator.stop(ctx.currentTime + 0.12)
    setTimeout(() => ctx.close(), 200)
  } catch {
    // Ignore audio errors silently
  }
}
