import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiAdapter } from './config/appkit.jsx'

const queryClient = new QueryClient()

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('LidexSwap Error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#050a06', color: 'white', minHeight: '100vh', padding: '20px', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#ef4444' }}>⚠️ LidexSwap - Error Detected</h1>
          <p>Secure error boundary caught an error to prevent blank screen:</p>
          <pre style={{ background: '#111a12', padding: '12px', borderRadius: '8px', border: '1px solid #ef4444', overflow: 'auto', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button onClick={() => window.location.reload()} style={{ background: '#22c55e', color: 'black', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', marginTop: '12px', border: 'none', cursor: 'pointer' }}>Reload Securely</button>
          <div style={{ marginTop: '20px', fontSize: '12px', color: '#8bb88f' }}>
            <div>Project ID: d7719d74fdd4d2ea309eb12d6eddb430 • BSC Mainnet • Reown AppKit</div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
          <App />
        </WagmiProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
