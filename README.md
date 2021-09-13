# DSM (DDP Study Manager) Frontend

## Building Locally

Run these steps to get going.  Ask a teammate for the appropriate GCP project.

```
nvm use 6.11.2
npm uninstall -g @angular/cli
npm install -g @angular/cli@1.3.0
npm install
gcloud --project=${PROJECT_ID} secrets versions access latest --secret="study-manager-ui-config" > ./src/assets/js/ddp_config.js
ng serve --proxy-config=proxy.conf.json
```

Then point your browser to http://localhost:4200 and you're good to go, assuming that you've also got the [backend up and running](https://github.com/broadinstitute/ddp-study-manager) locally!
