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
  primaryColor: 'blue',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  defaultRadius: 'md'
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
