# 18: Short preview videos for project covers (MP4/WebM, not GIF)

## What this does

Project covers could only be static images. Added support for a short video clip instead — MP4/WebM specifically, not GIF (Nikan's own call: GIF's compression is bad enough that the same clip is many times larger as a GIF than as MP4, for worse quality). Same upload field, same `image_url` column — a project's cover media is still one field, just told apart by file extension now.

```
backend/middleware/uploadImage.js   — video/mp4, video/webm added to the whitelist, limit raised to 10MB
frontend/lib/isVideoUrl.ts          — new, shared extension check
frontend/components/ProjectForm.tsx — <video> preview when the uploaded file is a video
frontend/app/projects/[slug]/page.tsx — <video autoplay loop muted> instead of <img> when applicable
```

## No new database column needed

A project's cover is still just `image_url` — one field. Whether it renders as `<img>` or `<video>` is decided purely by file extension (`/\.(mp4|webm)$/i`), computed in `lib/isVideoUrl.ts` and reused by both the admin form's preview and the public detail page. `s3Service.uploadImage` already passed the real `mimetype` through to S3's `ContentType` and preserved the original extension via `randomFileName()` — nothing there needed to change at all; the existing upload pipeline was already content-type agnostic.

## The actual AWS cost question, answered honestly

Nikan asked directly whether video would push S3 costs up. The real numbers: S3 storage is ~$0.023/GB/month, plus negligible per-request and data-transfer costs at this traffic level — a handful of few-MB clips costs a fraction of a cent per month to store. The real risk with video isn't storage cost, it's file size for a bad reason: GIF. The same 3-4 second clip that's 10-20MB as a GIF is often under 1MB as MP4 — so steering away from GIF isn't just an encoding preference, it directly avoids a real, avoidable cost and load-time increase.

## Verified live

- Generated a real 1-second black MP4 with `ffmpeg` (not a fake file with a spoofed extension — an actual valid video file).
- Uploaded it through the real `POST /admin/upload` endpoint with a disposable test admin session — confirmed `201` with a real S3 URL ending in `.mp4`.
- Temporarily pointed a real project's `image_url` at that test video and loaded its detail page — confirmed via the DOM (not just visually) that an actual `<video>` element rendered, not a broken `<img>`, with the correct `src`, playing, `duration: 1`.
- Restored the project's real `image_url` (`null`), deleted the disposable admin account, and deleted the test object from S3 directly — no test data or test cost left behind anywhere.

## One-line interview answer

> "Supporting a second media type for the same field needed zero schema changes — the upload pipeline already passed the real MIME type and extension through to S3 untouched, so the only real work was a one-line extension check shared between the admin preview and the public page to decide `<img>` vs `<video>`, and steering the format choice toward MP4 over GIF for a real, measurable size difference rather than just taste."
