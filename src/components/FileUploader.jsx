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
    <div
      className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 active:border-indigo-400 transition-colors"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => document.getElementById('file-input').click()}
    >
      <p className="text-gray-400 text-lg mb-2">
        <span className="hidden sm:inline">Dra lydfil hit, eller trykk for å velge</span>
        <span className="sm:hidden">Trykk for å velge lydfil</span>
      </p>
      <p className="text-gray-600 text-sm">MP3, WAV, M4A, AAC, AIFF, OGG, FLAC</p>
      <input
        id="file-input"
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
