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
  const [dragActive, setDragActive] = useState(false);

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
  mediaRecorderRef.current?.stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    setRecording(false);
  }

  // Use Next.js API proxy route to avoid CORS / mixed-origin issues.
  // Backend base URL is handled server-side in /api/upload.
  const apiUploadUrl = '/api/upload';

  async function upload(blob: Blob) {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');
      const response = await axios.post<ApiResponse>(apiUploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  function onFilePicked(file: File | null) {
    if (!file) return;
    const allowed = [
      'audio/webm','audio/wav','audio/x-wav','audio/mpeg','audio/mp3','audio/ogg','audio/mp4','audio/m4a',
      'video/mp4','video/mpeg','video/quicktime'
    ];
    const byType = allowed.includes(file.type);
    const byExt = /\.(webm|wav|mp3|m4a|ogg|mp4|mpeg|mov)$/i.test(file.name);
    if (!byType && !byExt) {
      setError('Unsupported file type. Use mp3/mp4/wav/webm/ogg/m4a.');
      return;
    }
    upload(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    onFilePicked(file);
    // allow picking the same file again
    e.currentTarget.value = '';
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(true);
  }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0] || null;
    onFilePicked(file);
  }

  return (
    <div className="card w-full max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold text-center">Transcripto</h1>
      <p className="text-center text-sm text-white/70">Record speech, get transcript & AI summary.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col items-center justify-center space-y-3">
          {recording ? (
            <button className="primary bg-red-600 hover:bg-red-700" onClick={stopRecording} disabled={loading}>Stop</button>
          ) : (
            <button className="primary" onClick={startRecording} disabled={loading}>Record</button>
          )}
          <span className="text-xs text-white/60">Record from your mic</span>
        </div>
        <div>
          <label className="block text-sm mb-2 text-white/80">Or drop an audio/video file</label>
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition ${dragActive ? 'border-indigo-400 bg-white/10' : 'border-white/20'}`}
          >
            <p className="text-sm mb-3 text-white/70">mp3, mp4, wav, webm, ogg, m4a</p>
            <input id="file-input" type="file" accept="audio/*,video/mp4,video/mpeg,video/quicktime" onChange={onInputChange} className="hidden" />
            <label htmlFor="file-input" className="primary inline-block cursor-pointer">Choose a file</label>
          </div>
        </div>
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
