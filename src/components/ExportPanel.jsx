import { useState } from 'react';
import { downloadBlob, downloadAllAsZip, mimeType } from '../utils/audioExport';

const QUALITY_OPTIONS = {
  mp3: [
    { value: 'high',   label: 'High',   desc: '~245 kbps VBR' },
    { value: 'medium', label: 'Medium', desc: '~165 kbps VBR' },
    { value: 'low',    label: 'Low',    desc: '~100 kbps VBR' },
  ],
  wav: [
    { value: 'high',   label: 'High',   desc: '44 100 Hz' },
    { value: 'medium', label: 'Medium', desc: '22 050 Hz' },
    { value: 'low',    label: 'Low',    desc: '11 025 Hz' },
  ],
};

export default function ExportPanel({ regions, crop, audioFile, exportClip, ffmpegReady, ffmpegLoading }) {
  const [format, setFormat] = useState('mp3');
  const [quality, setQuality] = useState('high');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('');

  // Apply crop boundaries to a region. Returns null if region is fully outside crop.
  function applyClip(region) {
    if (!crop) return region;
    const start = Math.max(region.start, crop.start);
    const end = Math.min(region.end, crop.end);
    if (start >= end) return null;
    return { ...region, start, end };
  }

  const visibleRegions = regions.map(applyClip).filter(Boolean);

  async function handleExportOne(region) {
    setProcessing(true);
    setStatus(`Eksporterer «${region.name}»…`);
    try {
      const data = await exportClip({ audioFile, start: region.start, end: region.end, gain: region.gain, format, quality });
      downloadBlob(data, `${region.name}.${format}`, mimeType(format));
      setStatus('');
    } catch (e) {
      setStatus(`Feil: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  }

  async function handleExportAll() {
    setProcessing(true);
    setStatus('Eksporterer alle klipp…');
    try {
      const clips = await Promise.all(
        visibleRegions.map(async (region) => {
          const data = await exportClip({ audioFile, start: region.start, end: region.end, gain: region.gain, format, quality });
          return { name: region.name, data, format };
        })
      );
      await downloadAllAsZip(clips);
      setStatus('');
    } catch (e) {
      setStatus(`Feil: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  }

  const disabled = !ffmpegReady || processing || visibleRegions.length === 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm text-gray-500 dark:text-gray-400">Format:</span>
        {['mp3', 'wav'].map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`min-h-[44px] px-5 rounded-lg text-sm font-medium transition-colors ${
              format === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-500 dark:text-gray-400">Quality:</span>
        {QUALITY_OPTIONS[format].map(({ value, label, desc }) => (
          <button
            key={value}
            onClick={() => setQuality(value)}
            className={`min-h-[44px] px-4 rounded-lg text-sm transition-colors flex flex-col items-center leading-tight py-1 ${
              quality === value ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
            }`}
          >
            <span className="font-medium">{label}</span>
            <span className="text-xs opacity-70">{desc}</span>
          </button>
        ))}
      </div>

      {ffmpegLoading && (
        <p className="text-yellow-400 text-sm">Laster ffmpeg…</p>
      )}

      {status && (
        <p className="text-indigo-300 text-sm">{status}</p>
      )}

      <div className="flex flex-col gap-2">
        {visibleRegions.map((region) => (
          <button
            key={region.id}
            onClick={() => handleExportOne(region)}
            disabled={disabled}
            className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 text-sm transition-colors text-left"
          >
            Last ned «{region.name}»
          </button>
        ))}
        {visibleRegions.length > 1 && (
          <button
            onClick={handleExportAll}
            disabled={disabled}
            className="w-full min-h-[44px] px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-sm font-medium transition-colors"
          >
            Last ned alle som ZIP
          </button>
        )}
      </div>
    </div>
  );
}
