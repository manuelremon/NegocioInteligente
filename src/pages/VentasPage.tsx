import { useState, useEffect, useCallback, useRef } from 'react'
import { Alert, Button, Stack, Center, Text, Loader } from '@mantine/core'
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

  // Check for active register session on mount
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

  // Keep amountTendered in sync for non-cash
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

  // Global keyboard shortcuts
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

  // Loading state while checking session
  if (checkingSession) {
    return (
      <Center h="100%">
        <Stack align="center" gap="xs">
          <Loader size="lg" />
          <Text c="dimmed">Verificando sesion de caja...</Text>
        </Stack>
      </Center>
    )
  }

  // No active session warning
  if (!currentSession) {
    return (
      <Center h="100%">
        <Alert variant="light" color="yellow" title="Caja no abierta" maw={500}>
          <Stack gap="sm">
            <Text size="sm">
              Para realizar ventas, primero debes abrir una sesion de caja.
              Ve al modulo de Caja para abrir una nueva sesion.
            </Text>
            <Button variant="light" color="blue" onClick={() => navigate('/caja')}>
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
          height: 'calc(100vh - 60px)',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: 12,
          overflow: 'hidden'
        }}
      >
        {/* Main content area */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 0 }}>
          {/* ====== LEFT SIDE - Search + Cart table (60%) ====== */}
          <div
            style={{
              flex: '0 0 60%',
              display: 'flex',
              flexDirection: 'column',
              borderRight: '2px solid #999',
              overflow: 'hidden'
            }}
          >
            {/* Product search bar */}
            <ProductSearch onAddToCart={handleAddToCart} />

            {/* Cart items table */}
            <Cart />
          </div>

          {/* ====== RIGHT SIDE - Payment panel (40%) ====== */}
          <div
            style={{
              flex: '0 0 40%',
              display: 'flex',
              flexDirection: 'column',
              background: '#f0f0f0',
              overflow: 'hidden'
            }}
          >
            {/* Total Comprobante - Digital display */}
            <div
              style={{
                background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
                padding: '14px 20px',
                borderBottom: '2px solid #0f3460',
                textAlign: 'right'
              }}
            >
              <div
                style={{
                  color: '#7ec8e3',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 4,
                  fontWeight: 600
                }}
              >
                Total Comprobante
              </div>
              <div
                style={{
                  color: '#00ff88',
                  fontSize: 36,
                  fontWeight: 700,
                  fontFamily: "'Consolas', 'Courier New', monospace",
                  textShadow: '0 0 10px rgba(0,255,136,0.3)',
                  lineHeight: 1.1
                }}
              >
                {formatCurrency(total)}
              </div>
              <div
                style={{
                  color: '#7ec8e3',
                  fontSize: 10,
                  marginTop: 4
                }}
              >
                {totalArticles} articulo(s) en {items.length} linea(s)
              </div>
            </div>

            {/* Payment method buttons */}
            <div
              style={{
                display: 'flex',
                gap: 4,
                padding: '8px 10px',
                background: '#d8d8d8',
                borderBottom: '1px solid #bbb'
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
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                overflow: 'auto'
              }}
            >
              {/* Pago */}
              <div>
                <div
                  style={{
                    background: '#2c3e50',
                    color: '#ecf0f1',
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    borderRadius: '3px 3px 0 0'
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
                      padding: '10px 14px',
                      fontSize: 28,
                      fontWeight: 700,
                      fontFamily: "'Consolas', monospace",
                      textAlign: 'right',
                      border: '2px solid #2c3e50',
                      borderTop: 'none',
                      borderRadius: '0 0 3px 3px',
                      background: '#fff',
                      color: '#2c3e50',
                      outline: 'none',
                      boxSizing: 'border-box' as const
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: 28,
                      fontWeight: 700,
                      fontFamily: "'Consolas', monospace",
                      textAlign: 'right',
                      border: '2px solid #2c3e50',
                      borderTop: 'none',
                      borderRadius: '0 0 3px 3px',
                      background: '#eee',
                      color: '#2c3e50',
                      boxSizing: 'border-box' as const
                    }}
                  >
                    {formatCurrency(total)}
                  </div>
                )}
              </div>

              {/* Vuelto */}
              <div>
                <div
                  style={{
                    background: change > 0 ? '#27ae60' : '#7f8c8d',
                    color: '#fff',
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    borderRadius: '3px 3px 0 0'
                  }}
                >
                  Vuelto
                </div>
                <div
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: 28,
                    fontWeight: 700,
                    fontFamily: "'Consolas', monospace",
                    textAlign: 'right',
                    border: `2px solid ${change > 0 ? '#27ae60' : '#7f8c8d'}`,
                    borderTop: 'none',
                    borderRadius: '0 0 3px 3px',
                    background: change > 0 ? '#f0fff4' : '#f5f5f5',
                    color: change > 0 ? '#27ae60' : '#95a5a6',
                    boxSizing: 'border-box' as const
                  }}
                >
                  {formatCurrency(change)}
                </div>
              </div>

              {/* Quick amount buttons for cash */}
              {paymentMethod === 'cash' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 4,
                    marginTop: 4
                  }}
                >
                  {[100, 200, 500, 1000, 2000, 5000, 10000, 20000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleQuickAmount(amt)}
                      style={{
                        padding: '6px 4px',
                        fontSize: 11,
                        fontWeight: 600,
                        background: 'linear-gradient(180deg, #f8f8f8 0%, #e0e0e0 100%)',
                        border: '1px solid #aaa',
                        borderRadius: 3,
                        cursor: 'pointer',
                        boxShadow:
                          '0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
                        color: '#333'
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
                gap: 4,
                padding: '8px 10px',
                background: '#d0d0d0',
                borderTop: '1px solid #bbb',
                flexShrink: 0
              }}
            >
              <button
                onClick={handleCheckout}
                disabled={items.length === 0}
                style={{
                  flex: 2,
                  padding: '12px 8px',
                  fontSize: 14,
                  fontWeight: 700,
                  background:
                    items.length === 0
                      ? '#bbb'
                      : 'linear-gradient(180deg, #27ae60 0%, #1e8449 100%)',
                  color: '#fff',
                  border: items.length === 0 ? '1px solid #999' : '1px solid #196f3d',
                  borderRadius: 4,
                  cursor: items.length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow:
                    items.length === 0
                      ? 'none'
                      : '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
                  textShadow: '0 1px 1px rgba(0,0,0,0.3)'
                }}
              >
                COBRAR [F2]
              </button>
              <button
                onClick={handleNewSale}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'linear-gradient(180deg, #3498db 0%, #2980b9 100%)',
                  color: '#fff',
                  border: '1px solid #2471a3',
                  borderRadius: 4,
                  cursor: 'pointer',
                  boxShadow:
                    '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
                  textShadow: '0 1px 1px rgba(0,0,0,0.3)'
                }}
              >
                Nuevo [F1]
              </button>
              <button
                onClick={handleNewSale}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'linear-gradient(180deg, #e74c3c 0%, #c0392b 100%)',
                  color: '#fff',
                  border: '1px solid #a93226',
                  borderRadius: 4,
                  cursor: 'pointer',
                  boxShadow:
                    '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
                  textShadow: '0 1px 1px rgba(0,0,0,0.3)'
                }}
              >
                Cancelar [Esc]
              </button>
            </div>
          </div>
        </div>

        {/* ====== BOTTOM BAR - Full-width Total ====== */}
        <div
          style={{
            background: 'linear-gradient(180deg, #2c3e50 0%, #1a252f 100%)',
            padding: '6px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '2px solid #1a252f',
            flexShrink: 0
          }}
        >
          <div
            style={{
              color: '#95a5a6',
              fontSize: 11,
              display: 'flex',
              gap: 16
            }}
          >
            <span>F1: Nuevo</span>
            <span>F2: Cobrar</span>
            <span>F5: Efectivo</span>
            <span>F6: Tarjeta</span>
            <span>F7: Fiado</span>
            <span>Enter: Agregar producto</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}
          >
            <span
              style={{
                color: '#bdc3c7',
                fontSize: 14,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1
              }}
            >
              Total:
            </span>
            <span
              style={{
                color: '#00ff88',
                fontSize: 28,
                fontWeight: 700,
                fontFamily: "'Consolas', 'Courier New', monospace",
                textShadow: '0 0 8px rgba(0,255,136,0.3)'
              }}
            >
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment confirmation modal */}
      <PaymentModal
        opened={paymentOpened}
        onClose={() => setPaymentOpened(false)}
        onConfirm={handlePaymentConfirm}
      />

      {/* Receipt modal */}
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
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '8px 6px',
        fontSize: 12,
        fontWeight: 600,
        background: active
          ? 'linear-gradient(180deg, #3498db 0%, #2980b9 100%)'
          : 'linear-gradient(180deg, #f0f0f0 0%, #d8d8d8 100%)',
        color: active ? '#fff' : '#333',
        border: active ? '2px solid #2471a3' : '1px solid #aaa',
        borderRadius: 3,
        cursor: 'pointer',
        boxShadow: active
          ? 'inset 0 1px 3px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.1)'
          : '0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
        textShadow: active ? '0 1px 1px rgba(0,0,0,0.3)' : 'none',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: 2
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: 9, opacity: 0.7 }}>[{shortcut}]</span>
    </button>
  )
}
