import clipList from '../data/audio-clips.json'

/** Must match the runtime cache name in vite.config.ts */
const CACHE = 'audio-clips'

/** Download every voice clip into the offline cache, skipping ones already there */
export async function warmAudioCache() {
  if (!('caches' in window)) return
  const cache = await caches.open(CACHE)
  const have = new Set((await cache.keys()).map((r) => r.url))
  const urls = (clipList as string[])
    .map((h) => new URL(`${import.meta.env.BASE_URL}audio/${h}.mp3`, location.href).href)
    .filter((u) => !have.has(u))

  let next = 0
  const worker = async () => {
    while (next < urls.length) {
      const url = urls[next++]
      try {
        await cache.add(url)
      } catch {
        // Offline or flaky network: try again on the next launch
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
}
