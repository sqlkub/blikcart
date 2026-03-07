#!/bin/bash
awslocal s3 mb s3://blikcart-assets
awslocal s3api put-bucket-cors --bucket blikcart-assets --cors-configuration '{
  "CORSRules": [{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }]
}'
echo "LocalStack S3 initialized"
