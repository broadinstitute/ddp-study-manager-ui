import { Injectable, Inject } from '@angular/core';
import {StackdriverErrorReporterService} from "./stackdriver-error-reporter.service";

type Logger = (message?: any, ...optionalParams: any[]) => void;

@Injectable()
export class LoggingService {
  // tslint:disable-next-line:no-console

//  public logDebug: Logger = this.showEvent(LogLevel.Debug) ? console.debug.bind(window.console) : () => { };
//
//  public logEvent: Logger = this.showEvent(LogLevel.Info) ? console.log.bind(window.console) : () => { };
//
//  public logWarning: Logger = this.showEvent(LogLevel.Warning) ? console.warn.bind(window.console) : () => { };

  public logError: Logger = this.showEvent() ?
    (...args) => {
      const stringifiedArgs = args.map(item => {
        return (typeof item === 'object') ? this.stringify(item) : item;
      });

      this.stackdriverErrorReporterService.handleError(stringifiedArgs.join(', '));
      console.error.apply(window.console, stringifiedArgs);
    }
    : () => { };

  constructor(
    private stackdriverErrorReporterService: StackdriverErrorReporterService) {}

  private showEvent(): boolean {
    return true;
  }

  private stringify(obj: object): string {
    return Object.keys(obj).map(key => `${key}: ${obj[key]}`).join(', ');
  }
}
