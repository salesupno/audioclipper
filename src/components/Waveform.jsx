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
  const [zoomSeconds, setZoomSeconds] = useState(0);
  const { init, ready, playing, currentTime, duration, regions, addRegion, addRegions, removeRegion, setRegionEnd, updateRegionMeta, togglePlay, playRegion, setZoomToSeconds, zoomToRegion, getDecodedData, destroy } = useWaveSurfer(containerRef);

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
        <div ref={containerRef} className="rounded-lg overflow-hidden bg-gray-900" />
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
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg" style={{ minHeight: 80 }}>
            <span className="inline-block w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-gray-400 text-sm">Loading waveform…</span>
          </div>
        )}
      </div>

      {ready && (
        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <span className="font-mono text-base text-white tabular-nums">{formatTime(currentTime)}</span>
          <span className="font-mono">{formatTime(duration)}</span>
        </div>
      )}

      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={togglePlay}
          disabled={!ready}
          className="min-w-[44px] min-h-[44px] px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 font-medium transition-colors"
        >
          {playing ? 'Pause' : 'Spill av'}
        </button>
        <button
          onClick={addRegion}
          disabled={!ready}
          className="min-w-[44px] min-h-[44px] px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 font-medium transition-colors"
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
              className="min-h-[44px] px-3 rounded-lg bg-gray-700 text-white text-sm border border-gray-600 focus:outline-none focus:border-indigo-500"
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

