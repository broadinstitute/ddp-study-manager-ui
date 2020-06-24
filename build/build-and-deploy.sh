#!/usr/bin/env bash
set -eu -o pipefail

PROJECT_ID=$1

#docker build -f Dockerfile-base -t study-manager-base .

#docker build -f Dockerfile-code -t study-manager-builder .

#docker run -it -v "$(pwd)"/build:/build study-manager-builder

#  todo arz add config.js somewhere
gcloud app deploy -q --stop-previous-version --project ${PROJECT_ID} StudyManager.yaml
