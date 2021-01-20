/// <amd-module name="UITest/_compiler/NullLogger" />

import { ErrorHandler, IErrorHandler, ILogger, Logger, ErrorFormatter, IMetaInfo } from 'UI/_builder/Tmpl/utils/ErrorHandler';

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
 * Decorate diagnostic message for JIT compile mode.
 * @param title {string} Compiler diagnostic message title.
 * @param message {string} Diagnostic message text.
 * @param meta {IMetaInfo} Meta information object.
 */
function decorate(title: string, message: string, meta: IMetaInfo): string {
   let decoratedMessage = `${title}: `;
   if (meta.fileName) {
      decoratedMessage += `${meta.fileName} `;
   }
   if (meta.position) {
      decoratedMessage += `(${meta.position.line + 1}:${meta.position.column + 1}) `;
   }
   decoratedMessage += message;
   return decoratedMessage;
}

/**
 * Create error handler with or without null logger.
 * @param useNullLogger {boolean} Use null logger. True by default.
 */
export default function createErrorHandler(useNullLogger: boolean = true): IErrorHandler {
   const logger = useNullLogger ? new NullLogger() : new Logger();
   const formatter = new ErrorFormatter('Template Compiler', decorate);
   return new ErrorHandler(logger, formatter);
}
