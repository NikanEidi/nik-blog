const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.S3_BUCKET_NAME;

// A random filename instead of the original one — avoids collisions
// between two different uploads named e.g. "photo.jpg", and avoids
// leaking the uploader's original filesystem naming onto a public URL.
function randomFileName(originalName) {
  const ext = originalName.includes('.') ? originalName.split('.').pop() : '';
  const random = crypto.randomBytes(16).toString('hex');
  return ext ? `${random}.${ext}` : random;
}

async function uploadImage(buffer, originalName, mimetype) {
  const key = randomFileName(originalName);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
  );

  return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

// Takes the full public URL (as stored on a project/note) and deletes just
// that object — used when an image is replaced or removed.
async function deleteImageByUrl(url) {
  const key = url.split('/').pop();
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

module.exports = { uploadImage, deleteImageByUrl };
