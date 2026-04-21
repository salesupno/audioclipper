// audioBuffer er en allerede-dekoda AudioBuffer (fra WaveSurfer)
export async function detectSilence(audioBuffer, {
  threshold = 0.015,
  minSilenceDuration = 0.5,
  minClipDuration = 1.0,
} = {}) {
  const sampleRate = audioBuffer.sampleRate;
  const windowSamples = Math.floor(sampleRate * 0.2); // 200ms vinduer
  const windowDuration = windowSamples / sampleRate;
  const channels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const numWindows = Math.ceil(length / windowSamples);
  const silent = new Uint8Array(numWindows);

  const channelData = [];
  for (let c = 0; c < channels; c++) {
    channelData.push(audioBuffer.getChannelData(c));
  }

  // Beregn RMS per vindu — yield hvert 10. vindu for å ikke fryse UI
  for (let w = 0; w < numWindows; w++) {
    if (w % 10 === 0) await new Promise((r) => setTimeout(r, 0));
    const start = w * windowSamples;
    const end = Math.min(start + windowSamples, length);
    let sum = 0;
    for (let c = 0; c < channels; c++) {
      const data = channelData[c];
      for (let i = start; i < end; i++) sum += data[i] * data[i];
    }
    silent[w] = Math.sqrt(sum / ((end - start) * channels)) < threshold ? 1 : 0;
  }

  const minSilenceWindows = Math.ceil(minSilenceDuration / windowDuration);
  const regions = [];
  let segStart = null;
  let silentRun = 0;
  let segEndWindow = 0;

  for (let w = 0; w < numWindows; w++) {
    if (silent[w]) {
      silentRun++;
      if (segStart !== null && silentRun === minSilenceWindows) {
        const end = (segEndWindow + 1) * windowDuration;
        if (end - segStart >= minClipDuration) regions.push({ start: segStart, end });
        segStart = null;
      }
    } else {
      silentRun = 0;
      segEndWindow = w;
      if (segStart === null) segStart = w * windowDuration;
    }
  }

  if (segStart !== null) {
    const end = Math.min(numWindows * windowDuration, audioBuffer.duration);
    if (end - segStart >= minClipDuration) regions.push({ start: segStart, end });
  }

  return regions;
}

