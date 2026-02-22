import { useEffect, useRef, useState } from 'react'
import { Modal, Select, Text, Stack, Group, Loader } from '@mantine/core'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

interface BarcodeScannerProps {
  opened: boolean
  onClose: () => void
  onScan: (code: string) => void
}

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.QR_CODE
]

type ScannerStatus = 'initializing' | 'scanning' | 'error'

export default function BarcodeScanner({ opened, onClose, onScan }: BarcodeScannerProps): JSX.Element {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  const [status, setStatus] = useState<ScannerStatus>('initializing')
  const [errorMsg, setErrorMsg] = useState('')
  const mountedRef = useRef(true)

  // Enumerate cameras when modal opens
  useEffect(() => {
    if (!opened) return

    mountedRef.current = true

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!mountedRef.current) return
        if (devices.length === 0) {
          setStatus('error')
          setErrorMsg('No se detectaron camaras en este equipo')
          return
        }
        const mapped = devices.map((d) => ({ id: d.id, label: d.label || `Camara ${d.id.slice(0, 8)}` }))
        setCameras(mapped)
        // Prefer back camera, fallback to first
        const back = mapped.find((c) => /back|rear|trasera|environment/i.test(c.label))
        setSelectedCamera(back?.id ?? mapped[0].id)
      })
      .catch(() => {
        if (!mountedRef.current) return
        setStatus('error')
        setErrorMsg('No se pudo acceder a la camara. Verifica los permisos.')
      })

    return () => {
      mountedRef.current = false
    }
  }, [opened])

  // Start scanner when camera is selected
  useEffect(() => {
    if (!opened || !selectedCamera) return

    const readerId = 'barcode-reader'
    // Small delay to ensure the DOM element is rendered
    const timer = setTimeout(() => {
      if (!mountedRef.current) return

      const scanner = new Html5Qrcode(readerId, {
        formatsToSupport: SUPPORTED_FORMATS,
        verbose: false
      })
      scannerRef.current = scanner

      setStatus('initializing')

      scanner
        .start(
          selectedCamera,
          { fps: 10, qrbox: { width: 280, height: 160 } },
          (decodedText) => {
            if (!mountedRef.current) return
            onScan(decodedText)
            // Stop after successful scan
            scanner
              .stop()
              .then(() => scanner.clear())
              .catch(() => {})
            scannerRef.current = null
            onClose()
          },
          () => {
            // Ignore scan failures (no code in frame)
          }
        )
        .then(() => {
          if (mountedRef.current) setStatus('scanning')
        })
        .catch((err: Error) => {
          if (!mountedRef.current) return
          setStatus('error')
          setErrorMsg(err.message || 'Error al iniciar la camara')
        })
    }, 100)

    return () => {
      clearTimeout(timer)
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {})
        scannerRef.current = null
      }
    }
  }, [opened, selectedCamera, onScan, onClose])

  // Cleanup on modal close
  useEffect(() => {
    if (!opened) {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {})
        scannerRef.current = null
      }
      setCameras([])
      setSelectedCamera(null)
      setStatus('initializing')
      setErrorMsg('')
    }
  }, [opened])

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Escanear codigo de barras / QR"
      size="lg"
      centered
      styles={{
        title: { fontWeight: 600, fontSize: 16 }
      }}
    >
      <Stack gap="sm">
        {cameras.length > 1 && (
          <Select
            label="Camara"
            data={cameras.map((c) => ({ value: c.id, label: c.label }))}
            value={selectedCamera}
            onChange={setSelectedCamera}
            size="sm"
          />
        )}

        <div
          id="barcode-reader"
          style={{
            width: '100%',
            minHeight: 300,
            borderRadius: 8,
            overflow: 'hidden',
            background: '#0f172a',
            position: 'relative'
          }}
        />

        <Group justify="center" gap="xs">
          {status === 'initializing' && (
            <>
              <Loader size="xs" />
              <Text size="sm" c="dimmed">Iniciando camara...</Text>
            </>
          )}
          {status === 'scanning' && (
            <Text size="sm" c="green" fw={500}>
              Apunta la camara al codigo de barras o QR
            </Text>
          )}
          {status === 'error' && (
            <Text size="sm" c="red" fw={500}>
              {errorMsg}
            </Text>
          )}
        </Group>

        <Text size="xs" c="dimmed" ta="center">
          Formatos: EAN-13, EAN-8, Code 128, Code 39, UPC-A, UPC-E, QR
        </Text>
      </Stack>
    </Modal>
  )
}
