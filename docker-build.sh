#!/usr/bin/env bash
set -eu -o pipefail

npm install
ng build --no-progress --environment=source --base-href=/ --output-path=/build/dist
# gzip and preserve unzipped stuff so we can serve out both compressed and uncompressed
gzip -k -q /build/dist/html/*.js || true
gzip -k -q /build/dist/html/assets/images/*.svg || true
gzip -k -q /build/dist/nginx/html/*.css || true
