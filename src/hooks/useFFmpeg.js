import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

export function useFFmpeg() {
  const ffmpegRef = useRef(new FFmpeg());
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const cachedInputRef = useRef(null); // { name, file }

  const load = useCallback(async () => {
    if (ready) return;
    setLoading(true);
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.load({
      coreURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    setReady(true);
    setLoading(false);
  }, [ready]);

  const exportClip = useCallback(async ({ audioFile, start, end, gain, format, quality }) => {
    const ffmpeg = ffmpegRef.current;
    const ext = audioFile.name.split('.').pop();
    const inputName = `input.${ext}`;
    const duration = end - start;
    const outputName = `output.${format}`;

    // Skriv kun til ffmpeg FS hvis fila har endret seg
    if (cachedInputRef.current?.file !== audioFile) {
      if (cachedInputRef.current) {
        try { await ffmpeg.deleteFile(cachedInputRef.current.name); } catch {}
      }
      await ffmpeg.writeFile(inputName, await fetchFile(audioFile));
      cachedInputRef.current = { name: inputName, file: audioFile };
    }

    const args = ['-i', inputName, '-ss', String(start), '-t', String(duration)];

    if (gain !== 0) {
      args.push('-af', `volume=${gain}dB`);
    }

    if (format === 'mp3') {
      // quality: 'high' = VBR V0 ~245kbps, 'medium' = VBR V4 ~165kbps, 'low' = VBR V7 ~100kbps
      const vbr = quality === 'low' ? '7' : quality === 'medium' ? '4' : '0';
      args.push('-c:a', 'libmp3lame', '-q:a', vbr);
    } else {
      // WAV: quality controls sample rate
      // 'high' = 44100 Hz, 'medium' = 22050 Hz, 'low' = 11025 Hz
      const ar = quality === 'low' ? '11025' : quality === 'medium' ? '22050' : '44100';
      args.push('-ar', ar);
      if (gain === 0) args.push('-c:a', 'copy');
    }

    args.push(outputName);

    await ffmpeg.exec(args);
    const data = await ffmpeg.readFile(outputName);
    await ffmpeg.deleteFile(outputName);

    return new Uint8Array(data);
  }, []);

  return { load, ready, loading, exportClip, ffmpeg: ffmpegRef.current };
}
