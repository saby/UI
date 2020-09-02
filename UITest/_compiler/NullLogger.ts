/// <amd-module name="UITest/_compiler/NullLogger" />

import ErrorHandler, { IErrorHandler, ILogger, Logger } from 'UI/_builder/Tmpl/utils/ErrorHandler';

/**
 * Null logger to keep console in browser clean.
 */
class NullLogger implements ILogger {
   log(): void { }
   warn(): void { }
   error(): void { }
}

/**
 * Create error handler with or without null logger.
 * @param useNullLogger {boolean} Use null logger. True by default.
 */
export default function createErrorHandler(useNullLogger: boolean = true): IErrorHandler {
   if (useNullLogger) {
      return new ErrorHandler(new NullLogger());
   }
   return new ErrorHandler(new Logger());
}
