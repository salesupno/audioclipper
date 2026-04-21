import { useState, useEffect, useRef } from 'react';
import FileUploader from './components/FileUploader';
import Waveform from './components/Waveform';
import RegionList from './components/RegionList';
import ExportPanel from './components/ExportPanel';
import { useFFmpeg } from './hooks/useFFmpeg';

export default function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [regions, setRegions] = useState([]);
  const [crop, setCrop] = useState(null);
  const [playhead, setPlayhead] = useState({ currentTime: 0, duration: 0 });
  const regionActionsRef = useRef({});
  const addRegionsRef = useRef(null);
  const getDecodedDataRef = useRef(null);
  const { load, ready: ffmpegReady, loading: ffmpegLoading, exportClip } = useFFmpeg();

  useEffect(() => {
    load();
  }, []);

  function handleFile(file) {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
    setRegions([]);
    setCrop(null);
    addRegionsRef.current = null;
  }

  function handleReady({ addRegions, getDecodedData }) {
    addRegionsRef.current = addRegions;
    getDecodedDataRef.current = getDecodedData;
  }

  function handleRegionsChange({ regions: r, removeRegion, setRegionEnd, updateRegionMeta, playRegion, zoomToRegion }) {
    setRegions(r);
    regionActionsRef.current = { removeRegion, setRegionEnd, updateRegionMeta, playRegion, zoomToRegion };
  }

  function handleRemove(id) {
    regionActionsRef.current.removeRegion?.(id);
  }

  function handleUpdate(id, updates) {
    regionActionsRef.current.updateRegionMeta?.(id, updates);
    setRegions((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }

  function handlePlay(id, start, end) {
    regionActionsRef.current.playRegion?.(id, start, end);
  }

  function handleSetEnd(id) {
    regionActionsRef.current.setRegionEnd?.(id);
  }

  function handleZoom(start, end) {
    regionActionsRef.current.zoomToRegion?.(start, end);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-white">Flyin Audioclipper</h1>

      <FileUploader onFile={handleFile} />

      {audioUrl && (
        <>
          <Waveform
            audioUrl={audioUrl}
            onReady={handleReady}
            onRegionsChange={handleRegionsChange}
            onTimeUpdate={setPlayhead}
            crop={crop}
          />

          <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-300">Crop</span>
            <button
              onClick={() => setCrop({ start: playhead.currentTime, end: crop?.end ?? playhead.duration })}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition-colors"
            >
              ← Set start
            </button>
            <button
              onClick={() => setCrop({ start: crop?.start ?? 0, end: playhead.currentTime })}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition-colors"
            >
              Set end →
            </button>
            {crop && (
              <button
                onClick={() => setCrop(null)}
                className="text-xs text-amber-400 hover:text-amber-300 underline ml-auto transition-colors"
              >
                Undo crop
              </button>
            )}
          </div>

          <RegionList
            regions={regions}
            onRemove={handleRemove}
            onUpdate={handleUpdate}
            onPlay={handlePlay}
            onSetEnd={handleSetEnd}
            onZoom={handleZoom}
          />

          <ExportPanel
            regions={regions}
            crop={crop}
            audioFile={audioFile}
            exportClip={exportClip}
            ffmpegReady={ffmpegReady}
            ffmpegLoading={ffmpegLoading}
          />
        </>
      )}

      <footer className="text-center text-xs text-gray-600 pt-2 pb-4">
        Flyin AS &mdash;{' '}
        <a href="https://flyin.no" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 underline transition-colors">flyin.no</a>
        {' '}&mdash; No files are stored &mdash; everything is gone when you refresh the page.
      </footer>
    </div>
  );
}
