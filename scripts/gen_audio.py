"""Generate neural voice clips with edge-tts from TEMP/tts/jobs.json.

Writes public/audio/<hash>.mp3, removes clips no longer referenced, and records the
available hashes in src/data/audio-clips.json. Existing clips are kept unless --force.

    python scripts/gen_audio.py [--force]
"""
import asyncio
import json
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
JOBS = ROOT / "TEMP" / "tts" / "jobs.json"
OUT = ROOT / "public" / "audio"
LIST = ROOT / "src" / "data" / "audio-clips.json"
CONCURRENCY = 4


async def make(job, sem, force, failed):
    path = OUT / f"{job['hash']}.mp3"
    if path.exists() and path.stat().st_size > 0 and not force:
        return
    async with sem:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(job["text"], job["voice"]).save(str(path))
                return
            except Exception as e:  # network hiccups: retry, then give up on this clip
                if attempt == 2:
                    failed.append((job["text"], str(e)))
                    path.unlink(missing_ok=True)
                await asyncio.sleep(1 + attempt)


async def main():
    force = "--force" in sys.argv
    jobs = json.loads(JOBS.read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)

    wanted = {j["hash"] for j in jobs}
    for f in OUT.glob("*.mp3"):
        if f.stem not in wanted:
            f.unlink()

    sem = asyncio.Semaphore(CONCURRENCY)
    failed = []
    await asyncio.gather(*(make(j, sem, force, failed) for j in jobs))

    have = sorted(f.stem for f in OUT.glob("*.mp3") if f.stat().st_size > 0)
    LIST.write_text(json.dumps(have) + "\n", encoding="utf-8")
    size = sum(f.stat().st_size for f in OUT.glob("*.mp3"))
    print(f"{len(have)}/{len(jobs)} clips, {size / 1e6:.1f} MB")
    for text, err in failed:
        print(f"FAILED: {text!r}: {err}")


asyncio.run(main())
