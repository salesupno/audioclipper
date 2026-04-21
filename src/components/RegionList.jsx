import RegionItem from './RegionItem';

export default function RegionList({ regions, onRemove, onUpdate, onPlay, onSetEnd, onZoom }) {
  if (regions.length === 0) {
    return (
      <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">
        Ingen klipp ennå. Trykk «+ Legg til klipp» for å markere et utsnitt.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {regions.map((region) => (
        <RegionItem
          key={region.id}
          region={region}
          onRemove={onRemove}
          onUpdate={onUpdate}
          onPlay={onPlay}
          onSetEnd={onSetEnd}
          onZoom={onZoom}
        />
      ))}
    </div>
  );
}
