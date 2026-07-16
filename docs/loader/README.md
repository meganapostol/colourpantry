# Crayon melt loader: assets and pipeline

Live mockup: https://claude.ai/code/artifact/12fb6446-6bf1-448a-b7b1-13218fbfc97e

**The video path won.** Two approaches were built and measured. This is the decision and the evidence.

## The decision

| asset | size | on the critical path? |
|---|---|---|
| `poster.webp` (unmelted crayons) | **46 KB** | **yes** |
| `melt.webm` (VP9 720p, 5s) | 314 KB | no, upgrade |
| `melt.mp4` (h264 fallback) | 248 KB | no, upgrade |
| `superseded-mask-still.webp` | 154 KB | (old approach, blocking) |

The video path has a **lighter first paint than the still it replaces**, and real wax on top. That is not what anyone expected going in.

**Why:** unmelted crayons are mostly flat canvas, so the poster compresses to 46 KB. The finished melt is detail everywhere, so it cost 154 KB. AJ's poster-frame rule (`build-bible/lessons/video-assets-no-lag`) pays twice here: it takes the video off the critical path *and* the frame it wants is the cheap one.

The old approach (one still of the finished melt, each drip revealed by a per-column mask) is kept as `superseded-mask-still.webp` plus `loader_template.html`, `drips.json` and `build_loader.py`. It works, but the drips never *form*: every shape is baked in, so there is no wet bead, no drop detaching, no pooling. It was a reveal wearing a melt costume. Do not ship it unless the video path dies on the CDN question below.

## Files

| File | What it is |
|---|---|
| `poster.webp` | 1280x720, 46 KB. Frame 0 of the video: crayons, clean canvas, no wax. **This is the `poster` attribute.** It must stay frame-exact or the handover flickers. |
| `melt.webm` | VP9, 720p, 24fps, 5s, no audio, crf 36. |
| `melt.mp4` | h264 crf 30, `+faststart`, no audio. Fallback. |
| `loader_video_template.html` | The mockup source. `__POSTER__`, `__WEBM__`, `__MP4__` are replaced with data URIs at build. |
| `superseded-*`, `loader_template.html`, `drips.json`, `build_loader.py` | The mask approach. Superseded, kept for reference. |

## How the melt tracks loading

`progress` is the fraction of settled boot promises (`registerBootTask(promise)`), never a timer.

```
target = progress ^ 2.2 * duration        // exponent MUST be > 1 or it decelerates
err    = target - video.currentTime
err > 0.02   -> play(), playbackRate = clamp(err * 3, 0.25, 4)
err <= 0.02  -> pause()                    // caught up: wax freezes
err < -0.15  -> seek                       // only when a human scrubs backwards
```

**playbackRate, not `currentTime`.** Seeking every frame is janky, worst on iOS Safari, and smooth seeking needs dense keyframes that inflate the file. The servo never seeks in the real loader. A stalled fetch freezes the wax mid-drip. A fast load makes it rush.

Verified: at 70% loaded the melt is 46% through the clip, so the last third rushes. That is the brief.

## Production notes and traps

- **`muted` and `playsinline` are mandatory**, or iOS silently never starts playback. `preload="auto"`.
- **Chrome pauses video-only media in background tabs** to save power, so `play()` rejects with `AbortError`. Always `.catch()` it. The poster shows meanwhile and the servo resumes on foreground. This is correct behaviour, not a bug.
- **Reduced motion holds the poster.** Do not play. The percentage readout still communicates position.
- **The source is 10s at 24fps, retimed to 5s** (`setpts=0.5*PTS,fps=24`). Without `fps=24` the retime silently doubles to 48fps and roughly doubles the file. The 5s duration keeps playbackRate in a sane range instead of needing 7x on a fast load.
- **Gemini burns a sparkle watermark into every frame.** Removed with `delogo=x=1130:y=570:w=62:h=62` and verified gone at t=0, 2 and 4.9s. Any regeneration needs the same check.
- **Never extract to a frame sequence or sprite sheet.** This footage is the best case for interframe compression (static crayons, static canvas, thin moving drips). Extracting throws that away and costs multiples more.

## Rebuild

```bash
ffmpeg -i melt_src.mp4 -vf "delogo=x=1130:y=570:w=62:h=62,setpts=0.5*PTS,fps=24" \
       -an -c:v libx264 -crf 12 -preset slow melt_master.mp4
ffmpeg -i melt_master.mp4 -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 \
       -deadline good -cpu-used 2 -an melt.webm
ffmpeg -i melt_master.mp4 -c:v libx264 -crf 30 -preset slow -pix_fmt yuv420p \
       -movflags +faststart -an melt.mp4
ffmpeg -i melt_master.mp4 -frames:v 1 -q:v 2 poster_raw.jpg    # then -> poster.webp q84
```

No system ffmpeg on this machine; `imageio_ffmpeg.get_ffmpeg_exe()` provides one.

## Open, and not guessed at

- **The CDN.** AJ's second rule has no Base44 answer. The platform reference is silent on whether `public/` assets or `UploadFile` are CDN-backed. Measure before shipping. The poster-frame move works regardless, which is why it leads.
- **Dark mode.** The footage is a light canvas, so on a dark theme this is a bright rectangle. Committed to the light treatment rather than guessing at an invert that would wreck the wax colours. Needs a human look.
- **Nobody has watched it play yet.** Verified here: the video loads (`readyState 4`), duration is 5.00s, 1280x720, the poster is set, VP9 is selected with the mp4 fallback present, and the servo math is right. Actual playback could not be observed because the preview pane keeps the tab backgrounded, which is exactly the condition that pauses video-only media.
