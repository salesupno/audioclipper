import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import { nanoid } from 'nanoid';

const REGION_COLORS = [
  'rgba(99, 102, 241, 0.3)',
  'rgba(16, 185, 129, 0.3)',
  'rgba(245, 158, 11, 0.3)',
  'rgba(239, 68, 68, 0.3)',
  'rgba(236, 72, 153, 0.3)',
];

export function useWaveSurfer(containerRef) {
  const wsRef = useRef(null);
  const regionsRef = useRef(null);
  const regionStartsRef = useRef({});
  const isRestoringRef = useRef(false);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(0);
  const [regions, setRegions] = useState([]);
  const colorIndexRef = useRef(0);

  const init = useCallback((audioUrl) => {
    if (wsRef.current) {
      wsRef.current.destroy();
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
    }

    const regionsPlugin = RegionsPlugin.create();
    regionsRef.current = regionsPlugin;

    const timelinePlugin = TimelinePlugin.create({
      style: { color: '#9ca3af', fontSize: '11px' },
    });

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4b5563',
      progressColor: '#6366f1',
      cursorColor: '#f9fafb',
      barWidth: 2,
      barGap: 1,
      height: 80,
      plugins: [regionsPlugin, timelinePlugin],
    });

    wsRef.current = ws;

    ws.on('ready', () => {
      setReady(true);
      setDuration(ws.getDuration());
      setCurrentTime(0);
      setZoom(0);

      // Set up Web Audio analyser for VU meter
      try {
        if (!audioCtxRef.current) {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          analyser.connect(ctx.destination);
          audioCtxRef.current = ctx;
          analyserRef.current = analyser;
        }
        const source = audioCtxRef.current.createMediaElementSource(ws.getMediaElement());
        source.connect(analyserRef.current);
        sourceNodeRef.current = source;
      } catch (_) {
        // Web Audio API not available
      }
    });

    ws.on('timeupdate', (t) => setCurrentTime(t));

    ws.on('play', () => { setPlaying(true); audioCtxRef.current?.resume(); });
    ws.on('pause', () => setPlaying(false));
    ws.on('finish', () => setPlaying(false));

    regionsPlugin.on('region-updated', (region) => {
      if (isRestoringRef.current) return;
      setRegions((prev) =>
        prev.map((r) =>
          r.id === region.id ? { ...r, start: region.start, end: region.end } : r
        )
      );
    });

    regionsPlugin.on('region-update-end', (region) => {
      if (isRestoringRef.current) return;
      const lockedStart = regionStartsRef.current[region.id];
      if (lockedStart !== undefined && Math.abs(region.start - lockedStart) > 0.001) {
        const confirmed = window.confirm('Er du sikker på at du vil flytte starten?');
        if (confirmed) {
          regionStartsRef.current[region.id] = region.start;
        } else {
          isRestoringRef.current = true;
          region.setOptions({ start: lockedStart });
          isRestoringRef.current = false;
          setRegions((prev) =>
            prev.map((r) =>
              r.id === region.id ? { ...r, start: lockedStart } : r
            )
          );
        }
      }
    });

    ws.load(audioUrl);
  }, [containerRef]);

  const addRegion = useCallback(() => {
    if (!wsRef.current || !regionsRef.current) return;
    const dur = wsRef.current.getDuration();
    const start = wsRef.current.getCurrentTime();
    const end = Math.min(start + 60, dur);
    const color = REGION_COLORS[colorIndexRef.current % REGION_COLORS.length];
    colorIndexRef.current += 1;

    const id = nanoid();
    regionStartsRef.current[id] = start;
    regionsRef.current.addRegion({
      id,
      start,
      end,
      color,
      drag: false,
      resize: true,
    });

    const newRegion = { id, name: `Klipp ${colorIndexRef.current}`, start, end, gain: 0, color };
    setRegions((prev) => [...prev, newRegion]);
  }, []);

  const setRegionEnd = useCallback((id) => {
    if (!wsRef.current || !regionsRef.current) return;
    const newEnd = wsRef.current.getCurrentTime();
    const wsRegion = regionsRef.current.getRegions().find((r) => r.id === id);
    if (wsRegion) wsRegion.setOptions({ end: newEnd });
    setRegions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, end: newEnd } : r))
    );
  }, []);

  const removeRegion = useCallback((id) => {
    if (!regionsRef.current) return;
    const wsRegions = regionsRef.current.getRegions();
    const match = wsRegions.find((r) => r.id === id);
    if (match) match.remove();
    delete regionStartsRef.current[id];
    setRegions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRegionMeta = useCallback((id, updates) => {
    setRegions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  }, []);

  const togglePlay = useCallback(() => {
    wsRef.current?.playPause();
  }, []);

  const playRegion = useCallback((id, start, end) => {
    if (!wsRef.current) return;
    wsRef.current.play(start, end);
  }, []);

  const addRegions = useCallback((regionArray) => {
    if (!regionsRef.current || !wsRef.current) return;
    regionsRef.current.clearRegions();
    colorIndexRef.current = 0;
    regionStartsRef.current = {};
    const newRegions = regionArray.map((r, i) => {
      const color = REGION_COLORS[i % REGION_COLORS.length];
      const id = nanoid();
      regionStartsRef.current[id] = r.start;
      regionsRef.current.addRegion({ id, start: r.start, end: r.end, color, drag: false, resize: true });
      return { id, name: `Klipp ${i + 1}`, start: r.start, end: r.end, gain: 0, color };
    });
    colorIndexRef.current = regionArray.length;
    setRegions(newRegions);
  }, []);

  const setZoomLevel = useCallback((minPxPerSec) => {
    if (!wsRef.current) return;
    wsRef.current.zoom(minPxPerSec);
    setZoom(minPxPerSec);
  }, []);

  const setZoomToSeconds = useCallback((visibleSeconds) => {
    if (!wsRef.current || !containerRef.current) return;
    if (visibleSeconds === 0) {
      wsRef.current.zoom(0);
      setZoom(0);
    } else {
      const pxPerSec = containerRef.current.clientWidth / visibleSeconds;
      wsRef.current.zoom(pxPerSec);
      setZoom(pxPerSec);
    }
  }, [containerRef]);

  const zoomToRegion = useCallback((start, end) => {
    if (!wsRef.current || !containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const regionDuration = end - start;
    if (regionDuration <= 0) return;
    const minPxPerSec = Math.floor(containerWidth / regionDuration);
    wsRef.current.zoom(minPxPerSec);
    setZoom(minPxPerSec);
    // Scroll til region-start
    setTimeout(() => {
      const wrapper = containerRef.current?.querySelector('div[part="scroll"]') ||
                      containerRef.current?.firstChild;
      if (wrapper) wrapper.scrollLeft = start * minPxPerSec;
    }, 50);
  }, [containerRef]);

  const getDecodedData = useCallback(() => {
    return wsRef.current?.getDecodedData() ?? null;
  }, []);

  const destroy = useCallback(() => {
    wsRef.current?.destroy();
    wsRef.current = null;
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    setReady(false);
    setRegions([]);
    setDuration(0);
    setPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.destroy();
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      audioCtxRef.current?.close();
    };
  }, []);

  return { init, ready, playing, currentTime, duration, zoom, regions, addRegion, addRegions, removeRegion, setRegionEnd, updateRegionMeta, togglePlay, playRegion, setZoomLevel, setZoomToSeconds, zoomToRegion, getDecodedData, destroy, analyserRef };
}
