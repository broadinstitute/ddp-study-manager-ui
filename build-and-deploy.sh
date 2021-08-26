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
echo "Deleting older versions"
SERVICE="study-manager-ui"
echo "The service name is *${SERVICE}*"
VERSIONS=$(gcloud app versions list --service  "${SERVICE}" --project ${PROJECT_ID} --sort-by '~version' --format 'value(version.id)')
echo $VERSIONS
echo "Will keep the latest 3 versions"
COUNT=0
for VERSION in $VERSIONS
do
    ((COUNT++))
    if [ $COUNT -gt 3 ]
    then
      echo "Going to delete version $VERSION of the ${SERVICE} service."
      gcloud app versions delete --quiet $VERSION --service ${SERVICE} --project ${PROJECT_ID} -q
    else
      echo "Going to keep version $VERSION of the ${SERVICE} service."
    fi
done
