#!/usr/bin/env bash
set -eu -o pipefail

PROJECT_ID=$1

echo "Building docker images"
docker build -f Dockerfile-base -t study-manager-base .

docker build -f Dockerfile-code -t study-manager-builder .

echo "Building angular app"
docker run -it -v "$(pwd)"/build:/build study-manager-builder

echo "Reading configs from ${PROJECT_ID} cloud secret manager"
gcloud --project=${PROJECT_ID} secrets versions access latest --secret="study-manager-ui-config" > ./build/dist/assets/js/ddp_config.js

(cd build && ./deploy_gae.sh ${PROJECT_ID})
