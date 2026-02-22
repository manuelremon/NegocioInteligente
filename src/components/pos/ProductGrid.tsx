import { useState, useCallback, useRef, useEffect } from 'react'
import { ActionIcon, Button, TextInput, Text, Paper, Tooltip } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import type { Product, CartItem } from '@renderer/types/ipc'
import BarcodeScanner from './BarcodeScanner'

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

// SVG icons inline to avoid extra dependencies
const IconBarcode = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5v14" /><path d="M8 5v14" /><path d="M12 5v14" /><path d="M17 5v14" /><path d="M21 5v14" />
  </svg>
)

const IconCamera = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
)

interface ProductSearchProps {
  onAddToCart: (item: CartItem) => void
}

// Threshold: if multiple chars arrive within this window, it's likely a scanner
const SCANNER_INPUT_THRESHOLD_MS = 50

export default function ProductSearch({ onAddToCart }: ProductSearchProps): JSX.Element {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [scannerOpen, setScannerOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const lastSearchTime = useRef<number>(0)

  // USB scanner rapid-input detection
  const lastInputTime = useRef<number>(0)
  const rapidCharCount = useRef<number>(0)
  const rapidInputTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  // F10 global shortcut for camera scanner
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'F10') {
        e.preventDefault()
        setScannerOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const addProductToCart = useCallback(
    (product: Product) => {
      if (product.trackInventory && product.stock <= 0) {
        notifications.show({
          title: 'Sin stock',
          message: `${product.name} no tiene stock disponible`,
          color: 'orange'
        })
        return
      }

      const item: CartItem = {
        productId: product.id,
        variantId: null,
        productName: product.name,
        variantName: null,
        quantity: 1,
        unitPrice: product.basePrice,
        discountPercent: 0,
        taxRate: product.taxRate,
        stock: product.stock
      }

      onAddToCart(item)
      setSearch('')
      setResults([])
      setShowResults(false)
      setSelectedIndex(-1)
      searchRef.current?.focus()
    },
    [onAddToCart]
  )

  const executeSearch = useCallback(async (query: string) => {
    if (!query.trim()) return

    const now = Date.now()
    lastSearchTime.current = now

    setLoading(true)
    try {
      const result = await window.api.products.search(query.trim())

      if (lastSearchTime.current !== now) return

      if (result.ok && result.data) {
        const products = result.data as Product[]

        if (products.length === 0) {
          notifications.show({
            title: 'No encontrado',
            message: `No se encontro producto: "${query.trim()}"`,
            color: 'yellow'
          })
          setResults([])
          setShowResults(false)
        } else if (products.length === 1) {
          addProductToCart(products[0])
        } else {
          setResults(products)
          setShowResults(true)
          setSelectedIndex(0)
        }
      } else {
        notifications.show({
          title: 'Error de busqueda',
          message: result.error ?? 'Error desconocido',
          color: 'red'
        })
      }
    } catch {
      notifications.show({
        title: 'Error de conexion',
        message: 'No se pudo buscar el producto',
        color: 'red'
      })
    } finally {
      if (lastSearchTime.current === now) {
        setLoading(false)
      }
    }
  }, [addProductToCart])

  const handleSearch = useCallback(() => {
    executeSearch(search)
  }, [search, executeSearch])

  const handleScanResult = useCallback(
    (code: string) => {
      setScannerOpen(false)
      setSearch(code)
      executeSearch(code)
      searchRef.current?.focus()
    },
    [executeSearch]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.currentTarget.value
    setSearch(value)

    // USB scanner rapid-input detection
    const now = Date.now()
    const timeSinceLastInput = now - lastInputTime.current
    lastInputTime.current = now

    if (timeSinceLastInput < SCANNER_INPUT_THRESHOLD_MS) {
      rapidCharCount.current++
    } else {
      rapidCharCount.current = 1
    }

    // If we've received 6+ chars rapidly, it's likely a scanner - auto-search after a brief pause
    if (rapidCharCount.current >= 6) {
      if (rapidInputTimer.current) clearTimeout(rapidInputTimer.current)
      rapidInputTimer.current = setTimeout(() => {
        rapidCharCount.current = 0
        if (value.trim()) {
          executeSearch(value)
        }
      }, 80)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Cancel any pending rapid-input timer since Enter takes priority
      if (rapidInputTimer.current) {
        clearTimeout(rapidInputTimer.current)
        rapidInputTimer.current = null
      }
      rapidCharCount.current = 0
      if (showResults && selectedIndex >= 0 && results[selectedIndex]) {
        addProductToCart(results[selectedIndex])
      } else {
        handleSearch()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (showResults && results.length > 0) {
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (showResults && results.length > 0) {
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      }
    } else if (e.key === 'Escape') {
      setShowResults(false)
      setResults([])
      setSelectedIndex(-1)
    }
  }

  useEffect(() => {
    if (dropdownRef.current && selectedIndex >= 0) {
      const items = dropdownRef.current.querySelectorAll('[data-result-item]')
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cleanup rapid-input timer on unmount
  useEffect(() => {
    return () => {
      if (rapidInputTimer.current) clearTimeout(rapidInputTimer.current)
    }
  }, [])

  return (
    <>
      <div style={{
        padding: '12px 16px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'relative',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Barcode scanner ready indicator */}
          <Tooltip label="Lector USB listo — escanea un codigo" position="bottom" withArrow>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6366f1',
              opacity: 0.7,
              flexShrink: 0
            }}>
              <IconBarcode />
            </div>
          </Tooltip>

          <div style={{ flex: 1, position: 'relative' }}>
            <TextInput
              ref={searchRef}
              placeholder="Buscar producto, codigo de barras o SKU... [Enter]"
              value={search}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (results.length > 0) setShowResults(true)
              }}
              size="sm"
              styles={{
                input: {
                  fontWeight: 500,
                  border: '1.5px solid #e2e8f0',
                  transition: 'border-color 150ms ease',
                  '&:focus': {
                    borderColor: '#6366f1'
                  }
                }
              }}
              rightSection={loading ? (
                <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>...</Text>
              ) : undefined}
            />

            {/* Search results dropdown */}
            {showResults && results.length > 0 && (
              <Paper
                ref={dropdownRef}
                shadow="lg"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  maxHeight: 280,
                  overflowY: 'auto',
                  zIndex: 1000,
                  border: '1px solid #e2e8f0',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px'
                }}
              >
                {results.map((product, idx) => {
                  const outOfStock = product.trackInventory && product.stock <= 0
                  const isSelected = idx === selectedIndex
                  return (
                    <div
                      key={product.id}
                      data-result-item
                      onClick={() => !outOfStock && addProductToCart(product)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        padding: '8px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: outOfStock ? 'not-allowed' : 'pointer',
                        opacity: outOfStock ? 0.4 : 1,
                        background: isSelected ? '#eef2ff' : '#fff',
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: 13,
                        transition: 'background 60ms ease'
                      }}
                    >
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 0 }}>
                        <span style={{
                          color: '#94a3b8',
                          fontSize: 11,
                          fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                          minWidth: 75,
                          flexShrink: 0
                        }}>
                          {product.barcode || product.sku || `ID:${product.id}`}
                        </span>
                        <span style={{
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: '#1e293b'
                        }}>
                          {product.name}
                        </span>
                        {product.categoryName && (
                          <span style={{
                            fontSize: 10,
                            color: '#6366f1',
                            background: '#eef2ff',
                            padding: '2px 8px',
                            borderRadius: 10,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            fontWeight: 500
                          }}>
                            {product.categoryName}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexShrink: 0, marginLeft: 10 }}>
                        <span style={{
                          fontSize: 11,
                          color: outOfStock ? '#ef4444' : product.stock <= product.minStock ? '#f59e0b' : '#22c55e',
                          fontWeight: 600
                        }}>
                          Stk: {product.stock}
                        </span>
                        <span style={{
                          fontWeight: 600,
                          color: '#1e293b',
                          minWidth: 85,
                          textAlign: 'right',
                          fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                          fontSize: 12
                        }}>
                          {formatCurrency(product.basePrice)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </Paper>
            )}
          </div>
          <Button
            onClick={() => {
              if (showResults && selectedIndex >= 0 && results[selectedIndex]) {
                addProductToCart(results[selectedIndex])
              } else if (search.trim()) {
                handleSearch()
              }
            }}
            size="sm"
            variant="filled"
          >
            Agregar
          </Button>
          <Tooltip label="Escanear con camara (F10)" position="bottom" withArrow>
            <ActionIcon
              variant="light"
              color="indigo"
              size="lg"
              onClick={() => setScannerOpen(true)}
              aria-label="Abrir escaner de camara"
            >
              <IconCamera />
            </ActionIcon>
          </Tooltip>
        </div>
      </div>

      <BarcodeScanner
        opened={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScanResult}
      />
    </>
  )
}
