# 08: Image uploads to S3 — least-privilege IAM, memory-buffered uploads

## What this does

Admin-only image uploads for projects and notes: a file picked in the admin form goes straight to a private S3 bucket (`nikblog-images`, publicly readable objects only), and the resulting URL is stored on the project/note row.

```
backend/services/s3Service.js        — uploadImage(), deleteImageByUrl()
backend/middleware/uploadImage.js    — multer config: memory storage, type/size limits
backend/controllers/adminController.js — uploadImage handler
backend/routes/admin.js              — POST /admin/upload, with multer error handling
frontend/components/NoteForm.tsx     — file input, uploads immediately on choose, shows a preview
```

## The S3 setup itself (AWS console work, not code)

- A dedicated bucket (`nikblog-images`, region `ca-central-1` — matches where Nikan actually is, lower latency than the US default).
- **Block Public Access** left mostly on, except the two "policy" sub-settings — allows a scoped bucket policy to grant public read, while ACL-based public access (a separate, harder-to-audit mechanism) stays fully blocked. This is AWS's own recommended pattern for "public read, no public write."
- A bucket policy granting `s3:GetObject` to everyone, on this bucket only — public read for images, nothing else.
- A dedicated **IAM user** (`nikblog-backend`) with a **custom policy** scoped to exactly `s3:PutObject` and `s3:DeleteObject` on `nikblog-images/*` — not a broad managed policy like `AmazonS3FullAccess`. This is the least-privilege principle in practice: if this access key ever leaked, the damage is capped at "someone can add or delete files in one images bucket," not "someone has access to every AWS resource in the account."

## Why `multer.memoryStorage()`, not disk storage

```js
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) { ... },
});
```

`memoryStorage` keeps the uploaded file as a `Buffer` in RAM (`req.file.buffer`) instead of writing it to a temp file on disk first. At this scale (small images, low traffic) that's simpler and faster — `s3Service.uploadImage` hands the buffer straight to S3's `PutObjectCommand` with no temp file to create or clean up afterward. Disk storage would matter at a much larger scale (huge files, needing to stream rather than hold everything in memory at once); not a concern here.

## Random filenames, not the original one

```js
function randomFileName(originalName) {
  const ext = originalName.includes('.') ? originalName.split('.').pop() : '';
  const random = crypto.randomBytes(16).toString('hex');
  return ext ? `${random}.${ext}` : random;
}
```

Two reasons: collision avoidance (two different uploads both named `photo.jpg` would otherwise overwrite each other in S3), and not leaking the uploader's original local filename onto a public URL.

## Handling a multer error without a broken response

```js
function handleUpload(req, res, next) {
  uploadImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
    next();
  });
}
```

When `fileFilter` rejects a file (wrong type) or the file exceeds the size limit, multer calls `next(err)` rather than throwing — left alone, that error falls through to Express's default error handler, which renders an HTML error page. Every other endpoint in this API returns JSON, so this wrapper catches that error explicitly and turns it into the same `{ status: 'error', message }` shape as everywhere else.

## `FormData`, not JSON, for the upload request

```ts
const formData = new FormData();
formData.append('image', file);

const res = await fetch(`${API_URL}/admin/upload`, {
  method: 'POST',
  credentials: 'include',
  body: formData,
});
```

No `Content-Type` header is set manually here — the browser sets `multipart/form-data` with a random boundary string itself, and that boundary is required for the backend (multer) to correctly split the request body back into fields and file data. Setting the header by hand would omit the boundary and break parsing entirely.

## Verified live

- Uploaded a real image through the note form — saw "Uploading...", then a live preview once `s3Service.uploadImage` returned the public URL.
- Confirmed the object lands in the `nikblog-images` bucket with a random filename, publicly readable via its S3 URL.

## One-line interview answer

> "The upload flow uses a dedicated IAM user scoped to exactly PutObject/DeleteObject on one bucket — not a broad managed policy — so a leaked key's blast radius is capped at that one bucket. Files are buffered in memory with multer rather than written to disk first, since nothing here needs to stream huge files, and get a random filename to avoid collisions and avoid leaking the uploader's original filename."
