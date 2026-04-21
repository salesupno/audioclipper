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
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('theme') !== 'light'; }
    catch { return true; }
  });
  const regionActionsRef = useRef({});
  const addRegionsRef = useRef(null);
  const getDecodedDataRef = useRef(null);
  const { load, ready: ffmpegReady, loading: ffmpegLoading, exportClip } = useFFmpeg();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Flyin Audioclipper</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 select-none">{dark ? 'Mørk' : 'Lys'}</span>
          <button
            onClick={() => setDark(d => !d)}
            aria-label={dark ? 'Bytt til lyst tema' : 'Bytt til mørkt tema'}
            className={`relative flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${dark ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${dark ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

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

      <footer className="text-center text-xs text-gray-400 dark:text-gray-600 pt-2 pb-4">
        Flyin AS &mdash;{' '}
        <a href="https://flyin.no" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 underline transition-colors">flyin.no</a>
        {' '}&mdash; No files are stored &mdash; everything is gone when you refresh the page.
      </footer>
    </div>
  );
}
