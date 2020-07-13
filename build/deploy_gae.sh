#!/usr/bin/env bash
set -eu -o pipefail

PROJECT_ID=$1

echo "Deploying to GAE"
gcloud app deploy -q --stop-previous-version --project ${PROJECT_ID} StudyManager.yaml
