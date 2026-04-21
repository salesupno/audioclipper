import { formatTime } from '../utils/formatTime';

export default function RegionItem({ region, onRemove, onUpdate, onPlay, onSetEnd, onZoom }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex flex-col gap-3">
      {/* Row 1: color dot + name + delete */}
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ background: region.color.replace('0.3', '1') }}
        />
        <input
          type="text"
          value={region.name}
          onChange={(e) => onUpdate(region.id, { name: e.target.value })}
          className="flex-1 bg-gray-100 dark:bg-gray-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={() => onRemove(region.id)}
          className="min-w-[44px] min-h-[44px] px-3 rounded bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-700 text-sm text-gray-900 dark:text-white transition-colors flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Row 2: time info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-3 flex-wrap">
        <span>Start: {formatTime(region.start)}</span>
        <span>Slutt: {formatTime(region.end)}</span>
        <span>Varighet: {formatTime(region.end - region.start)}</span>
      </div>

      {/* Row 3: playback + edit buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onPlay(region.id, region.start, region.end)}
          className="min-h-[44px] rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm text-gray-900 dark:text-white transition-colors"
          title="Spill av klipp"
        >
          ▶ Spill
        </button>
        <button
          onClick={() => onSetEnd(region.id)}
          className="min-h-[44px] rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-700 dark:hover:bg-amber-600 text-sm text-amber-900 dark:text-white transition-colors"
          title="Sett sluttpunkt til nåværende posisjon"
        >
          ⏹ Sett slutt
        </button>
        <button
          onClick={() => onZoom(region.start, region.end)}
          className="min-h-[44px] rounded bg-gray-100 hover:bg-indigo-100 dark:bg-gray-700 dark:hover:bg-indigo-700 text-sm text-gray-900 dark:text-white transition-colors"
          title="Zoom til klipp"
        >
          🔍 Zoom
        </button>
      </div>

      {/* Row 4: gain slider */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">
          {region.gain > 0 ? `+${region.gain}` : region.gain} dB
        </label>
        <input
          type="range"
          min="-20"
          max="20"
          step="1"
          value={region.gain}
          onChange={(e) => onUpdate(region.id, { gain: Number(e.target.value) })}
          className="flex-1 min-h-[44px] accent-indigo-500"
        />
      </div>

      {/* Gain level bar */}
      <div className="relative h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        <div className="absolute inset-y-0 left-1/2 w-px bg-gray-400 dark:bg-gray-500" />
        {region.gain > 0 && (
          <div
            className="absolute top-0 h-full bg-green-500 rounded-r-full"
            style={{ left: '50%', width: `${(region.gain / 20) * 50}%` }}
          />
        )}
        {region.gain < 0 && (
          <div
            className="absolute top-0 h-full bg-red-500 rounded-l-full"
            style={{ right: '50%', width: `${(Math.abs(region.gain) / 20) * 50}%` }}
          />
        )}
      </div>
    </div>
  );
}
