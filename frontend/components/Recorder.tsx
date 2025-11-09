"use client";
import { useState, useRef } from 'react';
import axios from 'axios';

interface ApiResponse {
  transcript: string;
  summary: string;
}

export default function Recorder() {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await upload(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err: any) {
      setError(err.message || 'Microphone access denied');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

  async function upload(blob: Blob) {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');
      const response = await axios.post<ApiResponse>(`${apiBase}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card w-full max-w-xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold text-center">Transcripto</h1>
      <p className="text-center text-sm text-white/70">Record speech, get transcript & AI summary.</p>
      <div className="flex justify-center">
        {recording ? (
          <button className="primary bg-red-600 hover:bg-red-700" onClick={stopRecording} disabled={loading}>Stop</button>
        ) : (
          <button className="primary" onClick={startRecording} disabled={loading}>Record</button>
        )}
      </div>
      {loading && (
        <div className="flex items-center justify-center space-x-3">
          <span className="spinner" />
          <span className="text-sm">Processing…</span>
        </div>
      )}
      {error && <div className="text-red-400 text-sm text-center">{error}</div>}
      {result && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Transcript</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">{result.transcript}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-1">AI Summary</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">{result.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
