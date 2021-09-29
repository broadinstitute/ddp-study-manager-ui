import { Injectable, Inject, ErrorHandler } from '@angular/core';
import {RoleService} from "./role.service";
import {SessionService} from "./session.service";
import StackdriverErrorReporter from 'stackdriver-errors-js';


declare var DDP_ENV: any;
//const {StackdriverErrorReporter} = require('@google-cloud/error-reporting');
@Injectable()
export class StackdriverErrorReporterService extends ErrorHandler {
  // TODO: update stackdriver-errors-js lib and add typings as soon as this PR merged and a new lib version released:
  // https://github.com/GoogleCloudPlatform/stackdriver-errors-js/pull/82
  private errorHandler: any;

  constructor(
    private sessionService: SessionService, private role: RoleService
  ) {
    super();

    const key = DDP_ENV.errorReportingApiKey;
    const projectId = DDP_ENV.projectGcpId;

    this.errorHandler =  new StackdriverErrorReporter();
    this.errorHandler.start({
      key,
      projectId,
      service: DDP_ENV.serviceName
    });

    this.checkReportingParams(key, projectId);
    this.errorHandler.setUser(this.getUserInfo());
  }

  public handleError(error: Error | string): void {
    if (DDP_ENV.doGcpErrorReporting) {
      this.errorHandler.report(error);
    }
    // Pass the error to the original handleError otherwise it gets swallowed in the browser console
    super.handleError(error);
  }

  private checkReportingParams(key: string, projectId: string): void {
    const missingParams = [];

    if (!key) {
      missingParams.push('errorReportingApiKey');
    } else if (!projectId) {
      missingParams.push('projectGcpId');
    }

    if (missingParams.length) {
      console.error('Missing parameters for StackDriver: ' + missingParams.join(', '));
    }
  }

  private getUserInfo(): string {
    return this.role.userID() ? this.role.userID() : 'unknown';
  }
}
