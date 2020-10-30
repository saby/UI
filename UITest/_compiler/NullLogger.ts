/// <amd-module name="UITest/_compiler/NullLogger" />

import { ErrorHandler, IErrorHandler, ILogger, Logger, ErrorFormatterJIT } from 'UI/_builder/Tmpl/utils/ErrorHandler';

/**
 * Null logger to keep console in browser clean.
 */
class NullLogger implements ILogger {
   log(): void { }
   warn(): void { }
   error(): void { }
   popLastErrorMessage(): string { return null; }
   flush():void { }
}

/**
 * Create error handler with or without null logger.
 * @param useNullLogger {boolean} Use null logger. True by default.
 */
export default function createErrorHandler(useNullLogger: boolean = true): IErrorHandler {
   const logger = useNullLogger ? new NullLogger() : new Logger();
   const formatter = new ErrorFormatterJIT('Template Compiler');
   return new ErrorHandler(logger, formatter);
}
