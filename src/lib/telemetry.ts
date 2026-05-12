// Decorative telemetry — deterministic 4-digit faux file id from a key.
// Used by the photo inspect treatment in both Astro and React components.
export function photoFileId(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return `IMG_${String(hash % 10000).padStart(4, '0')}`;
}
