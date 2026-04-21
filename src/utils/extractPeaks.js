/**
 * Decode audio at 8 kHz mono — ~10x less RAM and ~5-10x faster than full quality.
 * WaveSurfer accepts pre-computed peaks via ws.load(url, peaks, duration) and
 * uses a native <audio> element for playback, so no second decode happens.
 */
export async function extractPeaks(file) {
  const arrayBuffer = await file.arrayBuffer();

  // 8000 Hz is the minimum allowed by the spec — enough resolution for waveform display
  const audioCtx = new AudioContext({ sampleRate: 8000 });
  let audioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    audioCtx.close();
  }

  const duration = audioBuffer.duration;
  // Use channel 0 only — mono is sufficient for waveform display
  const channelData = audioBuffer.getChannelData(0);

  // 20 peaks per second gives enough detail for all zoom levels we support
  const numPeaks = Math.max(1000, Math.ceil(duration * 20));
  const blockSize = Math.max(1, Math.floor(channelData.length / numPeaks));
  const peaks = new Float32Array(numPeaks);

  for (let i = 0; i < numPeaks; i++) {
    let max = 0;
    const offset = i * blockSize;
    for (let j = 0; j < blockSize; j++) {
      const val = Math.abs(channelData[offset + j] || 0);
      if (val > max) max = val;
    }
    peaks[i] = max;
  }

  return { peaks: [peaks], duration };
}
