import { useState, useCallback, useRef, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import type { Product, CartItem } from '@renderer/types/ipc'

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

interface ProductSearchProps {
  onAddToCart: (item: CartItem) => void
}

export default function ProductSearch({ onAddToCart }: ProductSearchProps): JSX.Element {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const lastSearchTime = useRef<number>(0)

  // Auto-focus search input on mount
  useEffect(() => {
    searchRef.current?.focus()
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

  const handleSearch = useCallback(async () => {
    const query = search.trim()
    if (!query) return

    const now = Date.now()
    lastSearchTime.current = now

    setLoading(true)
    try {
      const result = await window.api.products.search(query)

      // Ignore stale responses
      if (lastSearchTime.current !== now) return

      if (result.ok && result.data) {
        const products = result.data as Product[]

        if (products.length === 0) {
          notifications.show({
            title: 'No encontrado',
            message: `No se encontro producto: "${query}"`,
            color: 'yellow'
          })
          setResults([])
          setShowResults(false)
        } else if (products.length === 1) {
          // Exactly one result: add immediately (barcode scanner behavior)
          addProductToCart(products[0])
        } else {
          // Multiple results: show dropdown to pick
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
  }, [search, addProductToCart])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
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

  // Scroll selected item into view
  useEffect(() => {
    if (dropdownRef.current && selectedIndex >= 0) {
      const items = dropdownRef.current.querySelectorAll('[data-result-item]')
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
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

  return (
    <div style={{
      padding: '6px 10px',
      background: 'linear-gradient(180deg, #ecf0f1 0%, #d5dbdb 100%)',
      borderBottom: '1px solid #bbb',
      position: 'relative',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#2c3e50',
          whiteSpace: 'nowrap'
        }}>
          Producto:
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={searchRef}
            type="text"
            placeholder="Nombre, codigo de barras o SKU... [Enter para buscar]"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0) setShowResults(true)
            }}
            style={{
              width: '100%',
              padding: '5px 10px',
              fontSize: 13,
              fontWeight: 500,
              border: '2px solid #2c3e50',
              borderRadius: 2,
              outline: 'none',
              fontFamily: "'Segoe UI', Tahoma, sans-serif",
              boxSizing: 'border-box',
              background: '#fff'
            }}
          />
          {loading && (
            <div style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 10,
              color: '#888',
              fontStyle: 'italic'
            }}>
              Buscando...
            </div>
          )}

          {/* Search results dropdown */}
          {showResults && results.length > 0 && (
            <div
              ref={dropdownRef}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                maxHeight: 260,
                overflowY: 'auto',
                background: '#fff',
                border: '1px solid #666',
                borderTop: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                zIndex: 1000
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
                      padding: '5px 10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: outOfStock ? 'not-allowed' : 'pointer',
                      opacity: outOfStock ? 0.45 : 1,
                      background: isSelected
                        ? '#cfe2f3'
                        : idx % 2 === 0 ? '#fff' : '#f7f7f7',
                      borderBottom: '1px solid #eee',
                      fontSize: 12,
                      transition: 'background 30ms'
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 0 }}>
                      <span style={{
                        color: '#666',
                        fontSize: 11,
                        fontFamily: "'Consolas', monospace",
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
                        color: '#2c3e50'
                      }}>
                        {product.name}
                      </span>
                      {product.categoryName && (
                        <span style={{
                          fontSize: 10,
                          color: '#7f8c8d',
                          background: '#ecf0f1',
                          padding: '1px 5px',
                          borderRadius: 2,
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          {product.categoryName}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexShrink: 0, marginLeft: 10 }}>
                      <span style={{
                        fontSize: 11,
                        color: outOfStock ? '#e74c3c' : product.stock <= product.minStock ? '#e67e22' : '#27ae60',
                        fontWeight: 600
                      }}>
                        Stk: {product.stock}
                      </span>
                      <span style={{
                        fontWeight: 700,
                        color: '#2c3e50',
                        minWidth: 85,
                        textAlign: 'right',
                        fontFamily: "'Consolas', monospace"
                      }}>
                        {formatCurrency(product.basePrice)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            if (showResults && selectedIndex >= 0 && results[selectedIndex]) {
              addProductToCart(results[selectedIndex])
            } else if (search.trim()) {
              handleSearch()
            }
          }}
          style={{
            padding: '5px 14px',
            fontSize: 12,
            fontWeight: 700,
            background: 'linear-gradient(180deg, #3498db 0%, #2980b9 100%)',
            color: '#fff',
            border: '1px solid #2471a3',
            borderRadius: 3,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
            textShadow: '0 1px 1px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap'
          }}
        >
          Agregar
        </button>
      </div>
    </div>
  )
}
