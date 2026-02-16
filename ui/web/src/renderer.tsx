import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { installPlatformShims, getSooseConfig, saveSooseConfig } from './platform';
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

/**
 * Try to auto-detect a local Goose.app instance by scanning likely ports.
 * Goose.app uses a random port each launch, so we try common ranges.
 * Returns { serverUrl, secretKey } if found, null otherwise.
 */
async function tryAutoDetectLocalGoose(): Promise<{ serverUrl: string; port: number } | null> {
  // The /status endpoint doesn't require auth, so we can probe for it.
  // Goose.app typically picks a random high port (49152-65535 range).
  // We can't know the secret key without `ps -E`, so auto-detection
  // only helps verify reachability. User still needs to provide the secret.
  
  // Check if we have a previously-working config
  const config = getSooseConfig();
  if (config.serverUrl && config.secretKey) {
    try {
      const res = await fetch(config.serverUrl + '/status', { signal: AbortSignal.timeout(2000) });
      if (res.ok) return { serverUrl: config.serverUrl, port: 0 };
    } catch {}
  }
  return null;
}

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

  // Verify connection is still alive before booting the app
  try {
    const res = await fetch(config.serverUrl + '/status', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error('status ' + res.status);
  } catch (err) {
    console.warn('[soose] Server not reachable, showing connection setup:', err);
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <ConnectionSetup initialError={`Cannot reach ${config.serverUrl}: ${err}`} />
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
function ConnectionSetup({ initialError }: { initialError?: string }) {
  const [serverUrl, setServerUrl] = React.useState(
    getSooseConfig().serverUrl || 'http://127.0.0.1:3000'
  );
  const [secretKey, setSecretKey] = React.useState(getSooseConfig().secretKey || '');
  const [workingDir, setWorkingDir] = React.useState(getSooseConfig().workingDir || '~');
  const [status, setStatus] = React.useState<'idle' | 'testing' | 'success' | 'error'>(
    initialError ? 'error' : 'idle'
  );
  const [errorMsg, setErrorMsg] = React.useState(initialError || '');

  const testConnection = async () => {
    setStatus('testing');
    setErrorMsg('');
    try {
      // First test /status (no auth required)
      const statusRes = await fetch(serverUrl + '/status', { signal: AbortSignal.timeout(5000) });
      if (!statusRes.ok) {
        setStatus('error');
        setErrorMsg('Server returned ' + statusRes.status);
        return;
      }
      // Then test auth by reading config
      if (secretKey) {
        const configRes = await fetch(serverUrl + '/config/read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Secret-Key': secretKey,
          },
          body: JSON.stringify({ key: 'GOOSE_PROVIDER', is_secret: false }),
          signal: AbortSignal.timeout(5000),
        });
        if (configRes.status === 401) {
          setStatus('error');
          setErrorMsg('Server reachable but secret key is wrong (401 Unauthorized)');
          return;
        }
        const data = await configRes.json();
        setStatus('success');
        setErrorMsg('');
        if (data) {
          setErrorMsg(`✓ Connected! Provider: ${data}`);
        }
      } else {
        setStatus('success');
        setErrorMsg('Server reachable (enter secret key to authenticate)');
      }
    } catch (e) {
      setStatus('error');
      setErrorMsg('Cannot reach server: ' + String(e));
    }
  };

  const handleConnect = () => {
    saveSooseConfig({ serverUrl, secretKey, workingDir });
    window.location.reload();
  };

  const handleDisconnect = () => {
    localStorage.removeItem('soose_config');
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
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '28px' }}>🪿 Soose</h1>
        <p style={{ margin: '0 0 24px', opacity: 0.7, fontSize: '14px' }}>
          Connect to a Goose server (goosed)
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
            Secret Key (X-Secret-Key header)
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
            placeholder="/home/user/projects"
            style={inputStyle}
          />
          <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.6 }}>
            Path on the <strong>server</strong>, not your local machine.
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
            {status === 'testing' ? 'Testing...' : 'Test Connection'}
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
          {initialError && (
            <button
              onClick={handleDisconnect}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                border: '1px solid #4a2020',
                background: 'transparent',
                color: '#f87171',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Reset
            </button>
          )}
        </div>

        {status === 'success' && (
          <p style={{ marginTop: '12px', color: '#4ade80', fontSize: '13px' }}>
            {errorMsg || 'Connected to server successfully'}
          </p>
        )}
        {status === 'error' && (
          <p style={{ marginTop: '12px', color: '#f87171', fontSize: '13px' }}>
            {errorMsg}
          </p>
        )}

        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#0f0f23',
          borderRadius: '8px',
          fontSize: '12px',
          lineHeight: '1.6',
        }}>
          <strong style={{ fontSize: '13px' }}>How to find your connection info:</strong>
          
          <div style={{ marginTop: '12px' }}>
            <div style={{ opacity: 0.8, marginBottom: '4px' }}>
              <strong>🖥️ Local Goose.app</strong> — find port &amp; secret from the running process:
            </div>
            <pre style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', fontFamily: 'monospace', opacity: 0.7, fontSize: '11px' }}>
{`ps -E $(pgrep -f "goosed agent") | tr ' ' '\n' | grep -E "GOOSE_PORT|SECRET"`}
            </pre>
          </div>

          <div style={{ marginTop: '12px' }}>
            <div style={{ opacity: 0.8, marginBottom: '4px' }}>
              <strong>🌐 Remote server</strong> — start goosed with explicit config:
            </div>
            <pre style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', fontFamily: 'monospace', opacity: 0.7, fontSize: '11px' }}>
{'GOOSE_HOST=0.0.0.0 GOOSE_PORT=3000 \\
GOOSE_SERVER__SECRET_KEY="your-secret" \\
goosed agent'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
