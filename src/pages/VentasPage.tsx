import { useState, useEffect, useCallback, useRef } from 'react'
import { Alert, Button, Stack, Center, Text, Loader, Paper, Group } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@renderer/stores/cartStore'
import { useRegisterStore } from '@renderer/stores/registerStore'
import ProductSearch from '@renderer/components/pos/ProductGrid'
import Cart from '@renderer/components/pos/Cart'
import PaymentModal from '@renderer/components/pos/PaymentModal'
import ReceiptModal from '@renderer/components/pos/ReceiptModal'
import type { Sale, CartItem } from '@renderer/types/ipc'

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

export default function VentasPage(): JSX.Element {
  const navigate = useNavigate()
  const currentSession = useRegisterStore((s) => s.currentSession)
  const setSession = useRegisterStore((s) => s.setSession)
  const addItem = useCartStore((s) => s.addItem)
  const getTotal = useCartStore((s) => s.getTotal)
  const items = useCartStore((s) => s.items)
  const paymentMethod = useCartStore((s) => s.paymentMethod)
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod)
  const clear = useCartStore((s) => s.clear)

  const [paymentOpened, setPaymentOpened] = useState(false)
  const [receiptOpened, setReceiptOpened] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [amountTendered, setAmountTendered] = useState<number>(0)

  const pagoInputRef = useRef<HTMLInputElement>(null)

  const total = getTotal()
  const amountNum = amountTendered
  const change = paymentMethod === 'cash' ? Math.max(0, amountNum - total) : 0

  const checkActiveSession = useCallback(async () => {
    setCheckingSession(true)
    try {
      const result = await window.api.cash.getActiveSession()
      if (result.ok && result.data) {
        setSession(result.data)
      } else {
        setSession(null)
      }
    } catch {
      setSession(null)
    } finally {
      setCheckingSession(false)
    }
  }, [setSession])

  useEffect(() => {
    checkActiveSession()
  }, [checkActiveSession])

  useEffect(() => {
    if (paymentMethod !== 'cash') {
      setAmountTendered(total)
    }
  }, [paymentMethod, total])

  const handleAddToCart = useCallback(
    (item: CartItem) => {
      addItem(item)
    },
    [addItem]
  )

  const handleCheckout = useCallback(() => {
    if (items.length === 0) return
    setPaymentOpened(true)
  }, [items.length])

  const handleNewSale = useCallback(() => {
    clear()
    setAmountTendered(0)
  }, [clear])

  const handlePaymentConfirm = useCallback((sale: Sale) => {
    setPaymentOpened(false)
    setLastSale(sale)
    setReceiptOpened(true)
    setAmountTendered(0)
  }, [])

  const handleReceiptClose = useCallback(() => {
    setReceiptOpened(false)
    setLastSale(null)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault()
        handleNewSale()
      }
      if (e.key === 'F2' || e.key === 'F12') {
        e.preventDefault()
        if (currentSession && items.length > 0) {
          handleCheckout()
        }
      }
      if (e.key === 'F5') {
        e.preventDefault()
        setPaymentMethod('cash')
      }
      if (e.key === 'F6') {
        e.preventDefault()
        setPaymentMethod('card')
      }
      if (e.key === 'F7') {
        e.preventDefault()
        setPaymentMethod('credit')
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        if (paymentOpened) {
          setPaymentOpened(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSession, items.length, handleCheckout, handleNewSale, setPaymentMethod, paymentOpened])

  const handlePagoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
    const num = parseFloat(raw)
    if (!isNaN(num)) {
      setAmountTendered(num)
    } else if (raw === '' || raw === '.') {
      setAmountTendered(0)
    }
  }

  const handleQuickAmount = (amt: number) => {
    setAmountTendered(amt)
    pagoInputRef.current?.focus()
  }

  if (checkingSession) {
    return (
      <Center h="100%">
        <Stack align="center" gap="xs">
          <Loader size="lg" color="indigo" />
          <Text c="dimmed">Verificando sesion de caja...</Text>
        </Stack>
      </Center>
    )
  }

  if (!currentSession) {
    return (
      <Center h="100%">
        <Alert variant="light" color="yellow" title="Caja no abierta" maw={500} radius="lg">
          <Stack gap="sm">
            <Text size="sm">
              Para realizar ventas, primero debes abrir una sesion de caja.
              Ve al modulo de Caja para abrir una nueva sesion.
            </Text>
            <Button variant="light" color="indigo" onClick={() => navigate('/caja')}>
              Ir a Caja
            </Button>
          </Stack>
        </Alert>
      </Center>
    )
  }

  const totalArticles = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 80px)',
          overflow: 'hidden',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          background: '#ffffff'
        }}
      >
        {/* Main content area */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* ====== LEFT SIDE - Search + Cart (60%) ====== */}
          <div
            style={{
              flex: '0 0 60%',
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
          >
            <ProductSearch onAddToCart={handleAddToCart} />
            <Cart />
          </div>

          {/* ====== RIGHT SIDE - Payment panel (40%) ====== */}
          <div
            style={{
              flex: '0 0 40%',
              display: 'flex',
              flexDirection: 'column',
              background: '#f8fafc',
              overflow: 'hidden'
            }}
          >
            {/* Total display */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                padding: '20px 24px',
                textAlign: 'right'
              }}
            >
              <Text
                size="xs"
                c="rgba(255,255,255,0.6)"
                fw={600}
                tt="uppercase"
                style={{ letterSpacing: 1.5, marginBottom: 6 }}
              >
                Total
              </Text>
              <Text
                style={{
                  color: '#a5b4fc',
                  fontSize: 38,
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                  lineHeight: 1.1
                }}
              >
                {formatCurrency(total)}
              </Text>
              <Text
                size="xs"
                c="rgba(255,255,255,0.45)"
                mt={6}
              >
                {totalArticles} articulo(s) en {items.length} linea(s)
              </Text>
            </div>

            {/* Payment method buttons */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                padding: '10px 14px',
                borderBottom: '1px solid #e2e8f0'
              }}
            >
              <PaymentMethodButton
                label="Efectivo"
                shortcut="F5"
                active={paymentMethod === 'cash'}
                onClick={() => setPaymentMethod('cash')}
              />
              <PaymentMethodButton
                label="Tarjeta"
                shortcut="F6"
                active={paymentMethod === 'card'}
                onClick={() => setPaymentMethod('card')}
              />
              <PaymentMethodButton
                label="Fiado"
                shortcut="F7"
                active={paymentMethod === 'credit'}
                onClick={() => setPaymentMethod('credit')}
              />
            </div>

            {/* Pago & Vuelto area */}
            <div
              style={{
                flex: 1,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                overflow: 'auto'
              }}
            >
              {/* Pago */}
              <Paper withBorder p={0} radius="md" style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    background: '#1e293b',
                    color: '#e2e8f0',
                    padding: '6px 14px',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 1.5
                  }}
                >
                  Pago
                </div>
                {paymentMethod === 'cash' ? (
                  <input
                    ref={pagoInputRef}
                    type="text"
                    value={amountNum > 0 ? amountNum.toString() : ''}
                    onChange={handlePagoChange}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: 28,
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                      textAlign: 'right',
                      border: 'none',
                      background: '#fff',
                      color: '#1e293b',
                      outline: 'none',
                      boxSizing: 'border-box' as const
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: 28,
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                      textAlign: 'right',
                      background: '#f1f5f9',
                      color: '#1e293b',
                      boxSizing: 'border-box' as const
                    }}
                  >
                    {formatCurrency(total)}
                  </div>
                )}
              </Paper>

              {/* Vuelto */}
              <Paper withBorder p={0} radius="md" style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    background: change > 0 ? '#059669' : '#94a3b8',
                    color: '#fff',
                    padding: '6px 14px',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                    transition: 'background 200ms'
                  }}
                >
                  Vuelto
                </div>
                <div
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: 28,
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                    textAlign: 'right',
                    background: change > 0 ? '#f0fdf4' : '#f8fafc',
                    color: change > 0 ? '#059669' : '#94a3b8',
                    boxSizing: 'border-box' as const,
                    transition: 'all 200ms'
                  }}
                >
                  {formatCurrency(change)}
                </div>
              </Paper>

              {/* Quick amount buttons */}
              {paymentMethod === 'cash' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 6,
                    marginTop: 4
                  }}
                >
                  {[100, 200, 500, 1000, 2000, 5000, 10000, 20000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleQuickAmount(amt)}
                      style={{
                        padding: '8px 4px',
                        fontSize: 12,
                        fontWeight: 600,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        cursor: 'pointer',
                        color: '#334155',
                        transition: 'all 100ms ease'
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLElement).style.background = '#eef2ff'
                        ;(e.currentTarget as HTMLElement).style.borderColor = '#a5b4fc'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLElement).style.background = '#ffffff'
                        ;(e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'
                      }}
                    >
                      ${amt.toLocaleString('es-AR')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                padding: '10px 14px',
                borderTop: '1px solid #e2e8f0',
                flexShrink: 0
              }}
            >
              <Button
                onClick={handleCheckout}
                disabled={items.length === 0}
                color="green"
                size="md"
                style={{ flex: 2 }}
                radius="md"
              >
                COBRAR [F2]
              </Button>
              <Button
                onClick={handleNewSale}
                variant="light"
                color="indigo"
                size="md"
                style={{ flex: 1 }}
              >
                Nuevo [F1]
              </Button>
              <Button
                onClick={handleNewSale}
                variant="light"
                color="red"
                size="md"
                style={{ flex: 1 }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>

        {/* ====== BOTTOM BAR ====== */}
        <div
          style={{
            background: '#1e293b',
            padding: '8px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            borderRadius: '0 0 12px 12px'
          }}
        >
          <Group gap="lg">
            <Text size="xs" c="rgba(255,255,255,0.4)">F1 Nuevo</Text>
            <Text size="xs" c="rgba(255,255,255,0.4)">F2 Cobrar</Text>
            <Text size="xs" c="rgba(255,255,255,0.4)">F5 Efectivo</Text>
            <Text size="xs" c="rgba(255,255,255,0.4)">F6 Tarjeta</Text>
            <Text size="xs" c="rgba(255,255,255,0.4)">F7 Fiado</Text>
          </Group>
          <Group gap="sm">
            <Text size="sm" c="rgba(255,255,255,0.5)" fw={600} tt="uppercase" style={{ letterSpacing: 1 }}>
              Total:
            </Text>
            <Text
              style={{
                color: '#a5b4fc',
                fontSize: 24,
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', 'Consolas', monospace"
              }}
            >
              {formatCurrency(total)}
            </Text>
          </Group>
        </div>
      </div>

      <PaymentModal
        opened={paymentOpened}
        onClose={() => setPaymentOpened(false)}
        onConfirm={handlePaymentConfirm}
      />

      <ReceiptModal
        opened={receiptOpened}
        onClose={handleReceiptClose}
        sale={lastSale}
      />
    </>
  )
}

function PaymentMethodButton({
  label,
  shortcut,
  active,
  onClick
}: {
  label: string
  shortcut: string
  active: boolean
  onClick: () => void
}): JSX.Element {
  return (
    <Button
      onClick={onClick}
      variant={active ? 'filled' : 'light'}
      color={active ? 'indigo' : 'gray'}
      size="sm"
      style={{ flex: 1 }}
      radius="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 9, opacity: 0.7 }}>[{shortcut}]</span>
      </div>
    </Button>
  )
}
