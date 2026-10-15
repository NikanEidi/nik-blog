// A project's `image_url` can point at an uploaded video clip now (short
// preview videos instead of a static cover, backend/middleware/uploadImage.js)
// — same field, told apart by file extension since the DB doesn't carry a
// separate media-type column for what's really still "the cover media."
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm)$/i.test(url);
}
