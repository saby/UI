/// <amd-module name="UITest/_compiler/NullLogger" />

import ErrorHandler, { IErrorHandler, ILogger } from 'UI/_builder/Tmpl/utils/ErrorHandler';

class NullLogger implements ILogger {
   log(): void { }
   warn(): void { }
   error(): void { }
}

export default function createErrorHandler(): IErrorHandler {
   return new ErrorHandler(new NullLogger());
}
