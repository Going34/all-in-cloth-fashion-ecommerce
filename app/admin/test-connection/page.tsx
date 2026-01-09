'use client';

import { useState } from 'react';
import { testDatabaseConnection, checkSupabaseConfig, diagnoseConnection } from '@/utils/dbConnection';

export default function TestConnectionPage() {
  const [status, setStatus] = useState<{
    loading: boolean;
    result?: any;
    error?: string;
  }>({ loading: false });

  const handleTestConnection = async () => {
    setStatus({ loading: true });
    try {
      const result = await testDatabaseConnection();
      setStatus({ loading: false, result });
    } catch (error) {
      setStatus({
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleFullDiagnostic = async () => {
    setStatus({ loading: true });
    try {
      const result = await diagnoseConnection();
      setStatus({ loading: false, result });
    } catch (error) {
      setStatus({
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const config = checkSupabaseConfig();

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Database Connection Test</h1>

        {/* Configuration Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Configuration Status</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  config.configured ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-slate-700">
                {config.configured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
            {config.url && (
              <div className="text-sm text-slate-600 ml-5">
                URL: <code className="bg-slate-100 px-2 py-1 rounded">{config.url}</code>
              </div>
            )}
            {config.missing.length > 0 && (
              <div className="text-sm text-red-600 ml-5">
                Missing: {config.missing.join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Test Connection</h2>
          <div className="flex gap-4">
            <button
              onClick={handleTestConnection}
              disabled={status.loading || !config.configured}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {status.loading ? 'Testing...' : 'Test Client Connection'}
            </button>
            <button
              onClick={handleFullDiagnostic}
              disabled={status.loading || !config.configured}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {status.loading ? 'Diagnosing...' : 'Full Diagnostic'}
            </button>
            <a
              href="/api/test-connection"
              target="_blank"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-block"
            >
              Test API Route
            </a>
          </div>
        </div>

        {/* Results */}
        {status.result && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Test Results</h2>
            <div
              className={`p-4 rounded-lg mb-4 ${
                status.result.connected
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    status.result.connected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="font-semibold">
                  {status.result.connected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <p className="text-slate-700 mb-2">{status.result.message}</p>
              {status.result.error && (
                <p className="text-red-600 text-sm">Error: {status.result.error}</p>
              )}
              {status.result.tables && status.result.tables.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    Accessible Tables ({status.result.tables.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {status.result.tables.map((table: string) => (
                      <span
                        key={table}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                      >
                        {table}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-4">
                Tested at: {status.result.timestamp}
              </p>
            </div>

            {/* Full Diagnostic Results */}
            {status.result.config && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">Configuration Details</h3>
                <pre className="text-xs text-slate-600 overflow-auto">
                  {JSON.stringify(status.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {status.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-600 text-sm">{status.error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">How to Use</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Ensure your <code className="bg-blue-100 px-1 rounded">.env.local</code> file has the required Supabase variables</li>
            <li>Click "Test Client Connection" to test from the browser</li>
            <li>Click "Full Diagnostic" for a comprehensive connection test</li>
            <li>Click "Test API Route" to test the server-side API endpoint</li>
            <li>Check the results to see which tables are accessible</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

