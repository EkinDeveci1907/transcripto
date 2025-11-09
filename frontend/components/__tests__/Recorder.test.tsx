import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Recorder from '../Recorder';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

function setupMediaMocks() {
  const mockTrack = { stop: jest.fn() };
  const mockStream = { getTracks: () => [mockTrack] } as MediaStream;

  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
      getUserMedia: jest.fn().mockResolvedValue(mockStream),
    },
    configurable: true,
  });

  class MockMediaRecorder {
    public stream = mockStream;
    public ondataavailable: ((event: BlobEvent) => void) | null = null;
    public onstop: (() => void) | null = null;
    start() {}
    stop() {
      this.ondataavailable?.({ data: new Blob(['test'], { type: 'audio/webm' }) } as BlobEvent);
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
    value: MockMediaRecorder as typeof MediaRecorder,
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
