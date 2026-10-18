terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = "ca-central-1"
  profile = "nikblog-terraform"
}

# S3 bucket: public image storage for nik-blog

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

#  IAM: the backend's dedicated least-privilege write access 

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
