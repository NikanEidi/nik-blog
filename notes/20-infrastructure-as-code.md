# 20: Infrastructure as Code — bringing the real S3/IAM setup under Terraform

Note 08 covered the S3 bucket and IAM user for image uploads — all built by hand in the AWS console. This note covers bringing that same, already-running infrastructure under Terraform, without destroying or recreating anything, using `terraform import`.

## Why `import`, not just writing the resources fresh

`nikblog-images` is a live bucket serving real images on the public site right now. If I'd written the Terraform code and run `apply`, it would have tried to create a bucket that already exists and failed — or worse, if I'd deleted the real one first to "start clean," every image URL already stored in the database would have broken. `terraform import` does the opposite: it reads the real, already-existing resource and records it into Terraform's state, without creating, changing, or deleting anything. The code only starts controlling the resource going forward, from this exact point.

## Getting the real configuration first, not guessing it

Before writing any `.tf` code, pulled the actual live settings with the AWS CLI, under a new dedicated IAM user (`nikblog-terraform`) scoped to read-only:

```bash
aws s3api get-bucket-policy --bucket nikblog-images
aws s3api get-public-access-block --bucket nikblog-images
```

Got back the exact bucket policy JSON and the exact public-access-block flags (`BlockPublicAcls: true, IgnorePublicAcls: true, BlockPublicPolicy: false, RestrictPublicBuckets: false`) — the real "public read, no public write" shape from note 08, now confirmed byte-for-byte instead of remembered from when I set it up.

## A dedicated, read-only IAM user for this — not reusing anything else

Created `nikblog-terraform`, separate from both `nikblog-backend` (the app's own upload credentials) and `terraform-practice` (my unrelated learning exercises). Its policy started scoped to individual `Get*` actions on just `nikblog-images`, but Terraform's own import process needed more read calls than I'd anticipated (`HeadBucket` for `s3:ListBucket`, then `GetBucketCors`, each surfacing as a real `AccessDenied` one at a time) — switched to `s3:Get*` + `s3:List*` wildcarded to just this one bucket ARN. Still fully read-only (no `Put`/`Delete`/`Set` actions anywhere in the policy), just not enumerated action-by-action, which is also the realistic way a "read-only" policy gets written on a real team.

## The six resources, matched to the real settings exactly

```hcl
resource "aws_s3_bucket" "images" {
  bucket = "nikblog-images"
}

resource "aws_s3_bucket_public_access_block" "images" {
  bucket = aws_s3_bucket.images.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "images" {
  bucket = aws_s3_bucket.images.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.images.arn}/*"
      }
    ]
  })
}

resource "aws_iam_user" "nikblog_backend" {
  name = "nikblog-backend"
}

resource "aws_iam_policy" "nikblog_backend_s3_write" {
  name        = "NikblogBackendS3Write"
  description = "Allows the nik-blog backend to upload and delete objects only in the nikblog-images S3 bucket."

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "AllowObjectWriteOnNikblogImages"
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.images.arn}/*"
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "nikblog_backend_s3_write" {
  user       = aws_iam_user.nikblog_backend.name
  policy_arn = aws_iam_policy.nikblog_backend_s3_write.arn
}
```

Code lives in [`infra/terraform/main.tf`](../infra/terraform/main.tf). The provider block pins a specific `profile = "nikblog-terraform"` so this project always runs under its own dedicated, scoped credentials, never whatever happens to be the default AWS CLI profile at the time.

## Importing, one resource at a time

```bash
terraform import aws_s3_bucket.images nikblog-images
terraform import aws_s3_bucket_public_access_block.images nikblog-images
terraform import aws_s3_bucket_policy.images nikblog-images
terraform import aws_iam_user.nikblog_backend nikblog-backend
terraform import aws_iam_policy.nikblog_backend_s3_write arn:aws:iam::654654323932:policy/NikblogBackendS3Write
terraform import aws_iam_user_policy_attachment.nikblog_backend_s3_write "nikblog-backend/arn:aws:iam::654654323932:policy/NikblogBackendS3Write"
```

Each `import` ID has its own shape depending on the resource type — a bucket name, a user name, a full policy ARN, or (for the attachment) a `user/policy-arn` pair.

## The real wall, hit twice

First `terraform import aws_s3_bucket.images` failed with `Cannot import non-existent remote object` — a confusing error, since the bucket obviously exists. Root cause: Terraform's S3 provider calls `HeadBucket` internally to confirm the bucket is really there before importing, and `HeadBucket` needs `s3:ListBucket`, which the read-only policy didn't have yet (it only had `Get*` bucket-config actions, not `ListBucket`). Verified directly with `aws s3api head-bucket` — a real `403 Forbidden`, confirming the cause before touching the policy.

After adding `s3:ListBucket`, the next import attempt failed differently: `reading S3 Bucket (nikblog-images) CORS configuration ... AccessDenied: ... s3:GetBucketCORS`. Rather than keep adding one specific action at a time as each new one surfaced, switched the policy to `s3:Get*` + `s3:List*` on the bucket — covers every read call the provider makes internally, still zero write access.

## Verified clean before trusting any of it

```
$ terraform plan

No changes. Your infrastructure matches the configuration.

Terraform has compared your real infrastructure against your configuration
and found no differences, so no changes are needed.
```

This is the actual proof the import worked correctly — if the `.tf` code had been even slightly wrong (a missing `Sid`, a different action list, a wrong public-access-block flag), `plan` would have shown a diff, and I'd have stopped there rather than ever running `apply`. Zero differences means the code is now a completely accurate, version-controlled description of what's actually running — and from here on, any real change to this infrastructure goes through code and `apply`, not console clicks.
