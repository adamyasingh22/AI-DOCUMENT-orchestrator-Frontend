'use client';

import React, { ChangeEvent, FormEvent, useState } from 'react';
import axios, { AxiosResponse } from 'axios';


export type StructuredJson = Record<string, unknown>;

export interface ProcessResponse {
  text: string;
  structuredJson: StructuredJson;
}

export interface WebhookResponse {
  n8n: Record<string, unknown>;
}

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState<string>('');
  const [structured, setStructured] = useState<StructuredJson | null>(null);
  const [text, setText] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [n8nResult, setN8nResult] = useState<Record<string, unknown> | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

  async function handleProcess(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      alert('Please upload a file first.');
      return;
    }

    setProcessing(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('question', question);

      const resp: AxiosResponse<ProcessResponse> = await axios.post(
        `${API}/api/process`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setText(resp.data.text);
      setStructured(resp.data.structuredJson);
      setN8nResult(null);
    } catch (err) {
      console.error(err);
      alert('Error processing document');
    } finally {
      setProcessing(false);
    }
  }

  async function handleSendAlert(): Promise<void> {
    if (!structured) {
      alert('Process document first');
      return;
    }
    if (!recipient) {
      alert('Enter a recipient email');
      return;
    }

    setSending(true);
    try {
      const resp: AxiosResponse<WebhookResponse> = await axios.post(
        `${API}/api/send-webhook`,
        {
          text,
          structuredJson: structured,
          question,
          recipientEmail: recipient,
        }
      );

      setN8nResult(resp.data.n8n);
    } catch (err) {
      console.error(err);
      alert('Error sending alert');
    } finally {
      setSending(false);
      alert('Alert sent successfully!');
    }
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0] ?? null;
    setFile(selectedFile);
  }

  return (
    <div className="mx-auto max-w-3xl p-6 font-sans">
      <h1 className="text-2xl font-semibold mb-4">AI Document Orchestrator</h1>

      <form onSubmit={handleProcess} className="flex flex-col gap-4">
        <label className="block">
          <span className="text-sm font-medium">Upload document (PDF / TXT)</span>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={onFileChange}
            className="mt-2 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-800 hover:file:bg-gray-600"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Ask a question about the document</span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about the document"
            className="mt-2 w-full min-h-[80px] rounded border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={processing}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {processing ? 'Processing...' : 'Process Document'}
          </button>

          <button
            type="button"
            disabled={processing}
            onClick={() => {
              setFile(null);
              setQuestion('');
              setStructured(null);
              setText('');
              setN8nResult(null);
            }}
            className="px-4 py-2 rounded border border-gray-300 disabled:opacity-60"
          >
            Reset
          </button>
        </div>
      </form>

      {structured && (
        <div className="mt-6">
          <h2 className="text-lg font-medium mb-2">Extracted JSON</h2>
          <pre className="bg-gray-800 p-4 rounded text-sm max-h-72 overflow-auto">
            {JSON.stringify(structured, null, 2)}
          </pre>

          <div className="mt-4">
            <h3 className="text-md font-medium mb-2">Send Alert</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="recipient@example.com"
                className="flex-1 rounded border border-gray-200 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />

              <button
                onClick={handleSendAlert}
                disabled={sending}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              >
                {sending ? 'Sending...' : 'Send Alert Mail'}
              </button>
            </div>
          </div>
        </div>
      )}

      {n8nResult && (
        <div className="mt-6">
          <h2 className="text-lg font-medium mb-2">n8n Response</h2>
          <pre className="bg-blue-50 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(n8nResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
