const ACCEPTED = '.mp3,.wav,.m4a,.aac,.aiff,.aif,.ogg,.flac';

export default function FileUploader({ onFile }) {
  function handleChange(e) {
    const file = e.target.files[0];
    if (file) onFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  return (
    <label
      htmlFor="file-input"
      className="block border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 active:border-indigo-400 transition-colors"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
        <span className="hidden sm:inline">Dra lydfil hit, eller trykk for å velge</span>
        <span className="sm:hidden">Trykk for å velge lydfil</span>
      </p>
      <p className="text-gray-400 dark:text-gray-600 text-sm">MP3, WAV, M4A, AAC, AIFF, OGG, FLAC</p>
      <input
        id="file-input"
        type="file"
        accept={ACCEPTED}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        onChange={handleChange}
      />
    </label>
  );
}
