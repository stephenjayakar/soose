import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { installPlatformShims, getSooseConfig } from './platform';
import { ConfigProvider } from './components/ConfigContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import SuspenseLoader from './suspense-loader';
import { client } from './api/client.gen';
import { setTelemetryEnabled } from './utils/analytics';
import { readConfig } from './api';

// Install platform shims BEFORE any component code runs
installPlatformShims();

const App = lazy(() => import('./App'));

const TELEMETRY_CONFIG_KEY = 'GOOSE_TELEMETRY_ENABLED';

(async () => {
  const config = getSooseConfig();

  // Check if server is configured
  if (!config.serverUrl || !config.secretKey) {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <ConnectionSetup />
      </React.StrictMode>
    );
    return;
  }

  console.log('[soose] connecting to goosed at', config.serverUrl);
  client.setConfig({
    baseUrl: config.serverUrl,
    headers: {
      'Content-Type': 'application/json',
      'X-Secret-Key': config.secretKey,
    },
  });

  try {
    const telemetryResponse = await readConfig({
      body: { key: TELEMETRY_CONFIG_KEY, is_secret: false },
    });
    const isTelemetryEnabled = telemetryResponse.data !== false;
    setTelemetryEnabled(isTelemetryEnabled);
  } catch (error) {
    console.warn('[soose] Failed to initialize analytics:', error);
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Suspense fallback={SuspenseLoader()}>
        <ConfigProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ConfigProvider>
      </Suspense>
    </React.StrictMode>
  );
})();

// --- Connection Setup Screen ---
function ConnectionSetup() {
  const [serverUrl, setServerUrl] = React.useState(
    getSooseConfig().serverUrl || 'http://127.0.0.1:3000'
  );
  const [secretKey, setSecretKey] = React.useState(getSooseConfig().secretKey || '');
  const [workingDir, setWorkingDir] = React.useState(getSooseConfig().workingDir || '~');
  const [status, setStatus] = React.useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = React.useState('');

  const testConnection = async () => {
    setStatus('testing');
    setErrorMsg('');
    try {
      const res = await fetch(serverUrl + '/status');
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg('Server returned ' + res.status);
      }
    } catch (e) {
      setStatus('error');
      setErrorMsg('Cannot reach server: ' + String(e));
    }
  };

  const handleConnect = () => {
    localStorage.setItem(
      'soose_config',
      JSON.stringify({ serverUrl, secretKey, workingDir })
    );
    window.location.reload();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #2a2a4a',
    background: '#0f0f23',
    color: '#e0e0e0',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#1a1a2e',
      color: '#e0e0e0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        background: '#16213e',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '28px' }}>Soose</h1>
        <p style={{ margin: '0 0 24px', opacity: 0.7, fontSize: '14px' }}>
          Connect to a remote Goose server
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', opacity: 0.8 }}>
            Server URL
          </label>
          <input
            type="url"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="http://your-server:3000"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', opacity: 0.8 }}>
            Secret Key (GOOSE_SERVER__SECRET_KEY)
          </label>
          <input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="Enter the server's secret key"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', opacity: 0.8 }}>
            Working Directory (server-side path)
          </label>
          <input
            type="text"
            value={workingDir}
            onChange={(e) => setWorkingDir(e.target.value)}
            placeholder="~ or /home/user/projects"
            style={inputStyle}
          />
          <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.6 }}>
            This must be a path on the server, not your local machine.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={testConnection}
            disabled={status === 'testing'}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              background: '#2a2a4a',
              color: '#e0e0e0',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {status === 'testing' ? 'Testing...' : 'Test'}
          </button>
          <button
            onClick={handleConnect}
            disabled={!secretKey}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              background: secretKey ? '#0f3460' : '#2a2a4a',
              color: '#e0e0e0',
              cursor: secretKey ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              flex: 1,
            }}
          >
            Connect
          </button>
        </div>

        {status === 'success' && (
          <p style={{ marginTop: '12px', color: '#4ade80', fontSize: '13px' }}>
            Connected to server successfully
          </p>
        )}
        {status === 'error' && (
          <p style={{ marginTop: '12px', color: '#f87171', fontSize: '13px' }}>
            {errorMsg}
          </p>
        )}

        <div style={{
          marginTop: '24px',
          padding: '12px',
          background: '#0f0f23',
          borderRadius: '6px',
          fontSize: '12px',
          opacity: 0.7,
        }}>
          <strong>Server setup:</strong> Run on your work machine:
          <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
{'GOOSE_HOST=0.0.0.0 GOOSE_PORT=3000 GOOSE_SERVER__SECRET_KEY="secret" goosed agent'}
          </pre>
        </div>
      </div>
    </div>
  );
}
