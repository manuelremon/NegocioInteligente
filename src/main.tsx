import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { HashRouter } from 'react-router-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import App from './App'

dayjs.locale('es')

const theme = createTheme({
  primaryColor: 'indigo',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  defaultRadius: 'md',
  colors: {
    indigo: [
      '#eef2ff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8',
      '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'
    ]
  },
  headings: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontWeight: '700'
  },
  components: {
    Button: {
      defaultProps: { radius: 'md' }
    },
    Paper: {
      defaultProps: { radius: 'lg', shadow: 'xs' }
    },
    Modal: {
      defaultProps: { radius: 'lg' }
    },
    TextInput: {
      defaultProps: { radius: 'md' }
    },
    Select: {
      defaultProps: { radius: 'md' }
    },
    NumberInput: {
      defaultProps: { radius: 'md' }
    },
    Badge: {
      defaultProps: { radius: 'md' }
    },
    Card: {
      defaultProps: { radius: 'lg', shadow: 'sm' }
    },
    Table: {
      defaultProps: { striped: 'odd', highlightOnHover: true }
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <HashRouter>
        <App />
      </HashRouter>
    </MantineProvider>
  </React.StrictMode>
)
