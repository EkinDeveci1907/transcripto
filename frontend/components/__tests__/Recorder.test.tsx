import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Recorder from '../Recorder';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

function setupMediaMocks() {
  // Mock a minimal MediaStreamTrack with required shape
  const mockTrack: MediaStreamTrack = {
    id: 't1',
    kind: 'audio',
    label: 'mock',
    enabled: true,
    muted: false,
    readyState: 'live',
    contentHint: '',
    stop: jest.fn(),
    applyConstraints: jest.fn() as any,
    clone: jest.fn() as any,
    getCapabilities: jest.fn() as any,
    getConstraints: jest.fn() as any,
    getSettings: jest.fn() as any,
    onended: null,
    onmute: null,
    onunmute: null,
    addEventListener: jest.fn() as any,
    removeEventListener: jest.fn() as any,
    dispatchEvent: jest.fn() as any,
  } as unknown as MediaStreamTrack;

  // Mock a MediaStream that satisfies the DOM typings
  const mockStream: MediaStream = {
    id: 's1',
    active: true,
    getTracks: () => [mockTrack],
    getAudioTracks: () => [mockTrack],
    getVideoTracks: () => [],
    getTrackById: jest.fn() as any,
    addTrack: jest.fn() as any,
    removeTrack: jest.fn() as any,
    onaddtrack: null,
    onremovetrack: null,
    addEventListener: jest.fn() as any,
    removeEventListener: jest.fn() as any,
    dispatchEvent: jest.fn() as any,
  } as unknown as MediaStream;

  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
      getUserMedia: jest.fn().mockResolvedValue(mockStream),
    },
    configurable: true,
  });

  class MockMediaRecorder {
    public stream: MediaStream;
    public state: RecordingState = 'inactive';
  public mimeType = 'audio/webm';
  public audioBitsPerSecond = 0;
  public videoBitsPerSecond = 0;
    public ondataavailable: ((event: BlobEvent) => void) | null = null;
    public onstop: (() => void) | null = null;
    public onerror: ((this: MediaRecorder, ev: Event) => any) | null = null;
    public onpause: ((this: MediaRecorder, ev: Event) => any) | null = null;
    public onresume: ((this: MediaRecorder, ev: Event) => any) | null = null;
    public onstart: ((this: MediaRecorder, ev: Event) => any) | null = null;

    constructor(stream: MediaStream, _options?: MediaRecorderOptions) {
      this.stream = stream;
    }

    static isTypeSupported(_type: string): boolean {
      return true;
    }

    start(_timeslice?: number) {
      this.state = 'recording';
      // no-op: optionally notify onstart handler
    }
    stop() {
      this.ondataavailable?.({ data: new Blob(['test'], { type: 'audio/webm' }) } as unknown as BlobEvent);
      this.state = 'inactive';
      this.onstop?.();
    }
    pause() {}
    resume() {}
    requestData() {}
    addEventListener() {}
    dispatchEvent() {
      return true;
    }
    removeEventListener() {}
  }

  Object.defineProperty(global, 'MediaRecorder', {
    value: MockMediaRecorder as unknown as typeof MediaRecorder,
    configurable: true,
  });
}

describe('Recorder component', () => {
  beforeEach(() => {
    setupMediaMocks();
    mockedAxios.post.mockResolvedValue({
      data: { transcript: 'mock transcript', summary: 'mock summary' },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders record and upload controls', () => {
    render(<Recorder />);

    expect(screen.getByRole('button', { name: /record/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/choose a file/i)).toBeInTheDocument();
  });

  it('records audio and uploads through the proxy route', async () => {
    render(<Recorder />);
    const recordButton = screen.getByRole('button', { name: /record/i });

    await userEvent.click(recordButton);

    const stopButton = screen.getByRole('button', { name: /stop/i });
    await userEvent.click(stopButton);

    await waitFor(() => expect(mockedAxios.post).toHaveBeenCalled());
    expect(await screen.findByText('mock transcript')).toBeInTheDocument();
    expect(await screen.findByText('mock summary')).toBeInTheDocument();
  });
});
