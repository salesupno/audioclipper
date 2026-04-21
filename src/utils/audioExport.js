import JSZip from 'jszip';

export function downloadBlob(data, filename, mimeType) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

export async function downloadAllAsZip(clips) {
  // clips: [{ name, data (Uint8Array), format }]
  const zip = new JSZip();
  clips.forEach(({ name, data, format }) => {
    zip.file(`${name}.${format}`, data);
  });
  const content = await zip.generateAsync({ type: 'uint8array' });
  downloadBlob(content, 'klipp.zip', 'application/zip');
}

export function mimeType(format) {
  return format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
}
