# DdpDsmAngular

This project was generated with [angular-cli](https://github.com/angular/angular-cli) version 1.0.0-beta.16
and switched to angular-cli 1.3.0

This project is using node version 6.11.2!

## Development server
Run `ng serve  --proxy-config=proxy.conf.json` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.
The proxy configuration sets up a proxy so that `/api/*` routes to your backend rest API in the _exact same way_ as nginx,
so there is no need to make different `baseUrl` configurations between local dev and remote deploys.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive/pipe/service/class`.

## Building with Secret Manager

To generate the `ddp_config.js` file, first do:
```shell
gcloud --project=${PROJECT_ID} secrets versions access latest --secret="study-manager-ui-config" > ./src/assets/js/ddp_config.js
```

from the top-level directory.  This will read config values from GCP secret manager.

Run `ng build --target=production --environment=source` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the `angular-cli` use `ng --help` or go check out the [Angular-CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
