import { useState } from 'react';

interface ApiKeyInputProps {
  provider: string;
  model: string;
  value: string;
  onChange: (value: string) => void;
  testConnection: (provider: string, model: string, apiKey: string) => Promise<{ success: boolean; error?: string }>;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'failure';

export default function ApiKeyInput({ provider, model, value, onChange, testConnection }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testError, setTestError] = useState('');

  const handleTest = async () => {
    if (!value.trim()) return;
    setTestStatus('testing');
    setTestError('');
    try {
      const result = await testConnection(provider, model, value);
      if (result.success) {
        setTestStatus('success');
      } else {
        setTestStatus('failure');
        setTestError(result.error ?? 'Connection failed');
      }
    } catch {
      setTestStatus('failure');
      setTestError('Unexpected error');
    }
  };

  return (
    <div className="api-key-input">
      <div className="api-key-row">
        <div className="api-key-field">
          <input
            type={showKey ? 'text' : 'password'}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (testStatus !== 'idle') setTestStatus('idle');
            }}
            placeholder="Enter API key..."
            className="api-key-text-input"
          />
          <button
            type="button"
            className="api-key-toggle"
            onClick={() => setShowKey(!showKey)}
            title={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? '\u25C9' : '\u25CE'}
          </button>
        </div>
        <button
          type="button"
          className="api-key-test-btn"
          onClick={handleTest}
          disabled={!value.trim() || testStatus === 'testing'}
        >
          {testStatus === 'testing' ? 'Testing...' : 'Test'}
        </button>
      </div>
      {testStatus === 'testing' && (
        <div className="api-key-status api-key-status--testing">
          <span className="api-key-spinner" /> Testing connection...
        </div>
      )}
      {testStatus === 'success' && (
        <div className="api-key-status api-key-status--success">
          &#10003; Connection successful
        </div>
      )}
      {testStatus === 'failure' && (
        <div className="api-key-status api-key-status--failure">
          &#10007; {testError}
        </div>
      )}
    </div>
  );
}
