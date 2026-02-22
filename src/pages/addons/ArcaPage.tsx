import { Stack, Text, Badge, Box, Flex, Group, Button } from '@mantine/core'

const FEATURES = [
  'Factura electronica tipo A, B y C',
  'Notas de credito y debito',
  'Libro IVA digital automatico',
  'Consulta de padron de contribuyentes'
]

export default function ArcaPage(): JSX.Element {
  return (
    <Stack gap={6}>
      {/* Header */}
      <Box style={{
        background: 'linear-gradient(180deg, #1a2744 0%, #0f1b33 100%)',
        padding: '4px 12px',
        borderRadius: 4
      }}>
        <Flex justify="space-between" align="center">
          <Text size="sm" fw={700} c="white">ARCA (AFIP)</Text>
          <Badge size="sm" color="violet" variant="filled">ENTERPRISE</Badge>
        </Flex>
      </Box>

      {/* Main content */}
      <Flex justify="center" pt={16}>
        <Box style={{
          maxWidth: 420,
          width: '100%',
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid #d1d5db',
          background: 'white',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          {/* Gradient banner */}
          <Box style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
            padding: '28px 24px',
            textAlign: 'center'
          }}>
            <Text style={{ fontSize: 52, lineHeight: 1, filter: 'brightness(1.2)' }}>🏛</Text>
            <Text size="xl" fw={800} c="white" mt={10}>Proximamente</Text>
            <Text size="xs" c="rgba(255,255,255,0.75)" mt={4}>
              Facturacion electronica integrada
            </Text>
          </Box>

          {/* Description */}
          <Box style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
            <Text size="sm" c="dark.5" ta="center" style={{ lineHeight: 1.6 }}>
              Emiti facturas electronicas y comunicate directamente con AFIP
              desde tu punto de venta sin intermediarios.
            </Text>
          </Box>

          {/* Features */}
          <Box style={{ padding: '16px 20px' }}>
            <Text size="xs" fw={700} c="dark.4" mb={10} style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Funcionalidades incluidas
            </Text>
            <Stack gap={8}>
              {FEATURES.map((feat) => (
                <Group key={feat} gap={10} wrap="nowrap">
                  <Box style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #c4b5fd 0%, #7c3aed 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    opacity: 0.5
                  }}>
                    <Text size="10px" c="white" fw={700}>✓</Text>
                  </Box>
                  <Text size="xs" c="dimmed">{feat}</Text>
                </Group>
              ))}
            </Stack>
          </Box>

          {/* Footer */}
          <Box style={{
            padding: '14px 20px',
            borderTop: '1px solid #f0f0f0',
            background: '#fafbfc',
            textAlign: 'center'
          }}>
            <Badge size="lg" variant="light" color="violet" mb={10}>Requiere Plan ENTERPRISE</Badge>
            <br />
            <Button size="xs" variant="default" disabled style={{ opacity: 0.6 }}>
              Mas informacion
            </Button>
          </Box>
        </Box>
      </Flex>
    </Stack>
  )
}
