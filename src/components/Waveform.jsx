import { useRef, useEffect, useState } from 'react';
import { useWaveSurfer } from '../hooks/useWaveSurfer';
import { formatTime } from '../utils/formatTime';

const ZOOM_LEVELS = [
  { label: 'Full', seconds: 0 },
  { label: '20 min', seconds: 1200 },
  { label: '10 min', seconds: 600 },
  { label: '5 min', seconds: 300 },
  { label: '2 min', seconds: 120 },
  { label: '1 min', seconds: 60 },
  { label: '30 sek', seconds: 30 },
];

export default function Waveform({ audioUrl, onReady, onRegionsChange, onTimeUpdate, crop }) {
  const containerRef = useRef(null);
  const meterFillRef = useRef(null);
  const animFrameRef = useRef(null);
  const [zoomSeconds, setZoomSeconds] = useState(0);
  const { init, ready, playing, currentTime, duration, regions, addRegion, addRegions, removeRegion, setRegionEnd, updateRegionMeta, togglePlay, playRegion, setZoomToSeconds, zoomToRegion, getDecodedData, destroy, analyserRef } = useWaveSurfer(containerRef);

  useEffect(() => {
    onTimeUpdate?.({ currentTime, duration });
  }, [currentTime, duration]);

  useEffect(() => {
    if (audioUrl) {
      init(audioUrl);
    }
    return () => {
      if (!audioUrl) destroy();
    };
  }, [audioUrl]);

  useEffect(() => {
    if (ready) onReady?.({ duration, addRegions, getDecodedData });
  }, [ready, duration]);

  useEffect(() => {
    onRegionsChange?.({ regions, removeRegion, setRegionEnd, updateRegionMeta, playRegion, zoomToRegion });
  }, [regions]);

  // VU meter animation loop
  useEffect(() => {
    if (!playing || !analyserRef.current) {
      if (meterFillRef.current) meterFillRef.current.style.width = '0%';
      return;
    }
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let smoothLevel = 0;
    function tick() {
      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const s = (dataArray[i] - 128) / 128;
        sum += s * s;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const dB = 20 * Math.log10(rms + 1e-9);
      const pct = Math.max(0, Math.min(100, ((dB + 60) / 60) * 100));
      smoothLevel = pct > smoothLevel ? pct * 0.8 + smoothLevel * 0.2 : pct * 0.05 + smoothLevel * 0.95;
      if (meterFillRef.current) meterFillRef.current.style.width = `${smoothLevel}%`;
      animFrameRef.current = requestAnimationFrame(tick);
    }
    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (meterFillRef.current) meterFillRef.current.style.width = '0%';
    };
  }, [playing]);

  useEffect(() => {
    if (!ready) return;
    function handleKeyDown(e) {
      if (e.code !== 'Space') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      togglePlay();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ready, togglePlay]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <div ref={containerRef} className="rounded-lg overflow-hidden bg-white dark:bg-gray-900" />
        {ready && crop && duration > 0 && (
          <>
            {crop.start > 0 && (
              <div
                className="absolute top-0 left-0 h-full bg-black/70 cursor-not-allowed rounded-l-lg"
                style={{ width: `${(crop.start / duration) * 100}%` }}
              />
            )}
            {crop.end < duration && (
              <div
                className="absolute top-0 right-0 h-full bg-black/70 cursor-not-allowed rounded-r-lg"
                style={{ width: `${((duration - crop.end) / duration) * 100}%` }}
              />
            )}
          </>
        )}
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 rounded-lg" style={{ minHeight: 80 }}>
            <span className="inline-block w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-gray-400 text-sm">Loading waveform…</span>
          </div>
        )}
      </div>

      {ready && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
          <span className="font-mono text-base text-gray-900 dark:text-white tabular-nums">{formatTime(currentTime)}</span>
          <span className="font-mono">{formatTime(duration)}</span>
        </div>
      )}

      {ready && (
        <div className="h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700" title="Lydnivå">
          <div
            ref={meterFillRef}
            style={{ width: '0%', background: 'linear-gradient(to right, #22c55e 0%, #eab308 65%, #ef4444 100%)' }}
            className="h-full"
          />
        </div>
      )}

      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={togglePlay}
          disabled={!ready}
          className="min-w-[44px] min-h-[44px] px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 font-medium text-white transition-colors"
        >
          {playing ? 'Pause' : 'Spill av'}
        </button>
        <button
          onClick={addRegion}
          disabled={!ready}
          className="min-w-[44px] min-h-[44px] px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-40 font-medium text-gray-900 dark:text-white transition-colors"
        >
          + Legg til klipp
        </button>
        {ready && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-500">Zoom</span>
            <select
              value={zoomSeconds}
              onChange={(e) => {
                const secs = Number(e.target.value);
                setZoomSeconds(secs);
                setZoomToSeconds(secs);
              }}
              className="min-h-[44px] px-3 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-indigo-500"
            >
              {ZOOM_LEVELS.map(({ label, seconds }) => (
                <option key={seconds} value={seconds}>{label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

