/// <amd-module name="UI/_builder/Tmpl/utils/ErrorHandler" />

// @ts-ignore
import { IoC } from 'Env/Env';
import { SourcePosition } from 'UI/_builder/Tmpl/html/Reader';

function log(message: string): void {
   IoC.resolve('ILogger').log(message);
}

function warn(message: string): void {
   IoC.resolve('ILogger').warn(message);
}

function error(message: string): void {
   IoC.resolve('ILogger').error(message);
}

export interface ILogger {
   log(message: string): void;
   warn(message: string): void;
   error(message: string): void;
   popLastErrorMessage(): string;
   flush(): void;
}

export class Logger implements ILogger {
   log(message: string): void {
      log(message);
   }
   warn(message: string): void {
      warn(message);
   }
   error(message: string): void {
      error(message);
   }
   popLastErrorMessage(): string {
      return null;
   }
   flush(): void { }
}

enum MessageType {
   LOG,
   WARN,
   ERROR
}

interface IMessage {
   type: MessageType;
   message: string;
}

export class StackLogger implements ILogger {
   private readonly stack: IMessage[];

   constructor() {
      this.stack = [];
   }

   log(message: string): void {
      this.stack.push({
         type: MessageType.LOG,
         message
      });
   }

   warn(message: string): void {
      this.stack.push({
         type: MessageType.WARN,
         message
      });
   }

   error(message: string): void {
      this.stack.push({
         type: MessageType.ERROR,
         message
      });
   }

   popLastErrorMessage(): string {
      let lastIndex: number = this.stack.length - 1;
      for (; lastIndex > -1; --lastIndex) {
         if (this.stack[lastIndex].type === MessageType.ERROR) {
            const lastErrorMessage = this.stack[lastIndex].message;
            this.stack.splice(lastIndex, 1);
            return lastErrorMessage;
         }
      }
      return null;
   }

   flush(): void {
      while (this.stack.length > 0) {
         const item: IMessage = this.stack.shift();
         switch (item.type) {
            case MessageType.ERROR:
               error(item.message);
               break;
            case MessageType.WARN:
               warn(item.message);
               break;
            default:
               log(item.message);
               break;
         }
      }
   }
}

export interface IMetaInfo {
   fileName?: string;
   position?: SourcePosition;
}

export interface IErrorFormatter {
   debug(message: string, meta: IMetaInfo): string;
   info(message: string, meta: IMetaInfo): string;
   warn(message: string, meta: IMetaInfo): string;
   error(message: string, meta: IMetaInfo): string;
   critical(message: string, meta: IMetaInfo): string;
   fatal(message: string, meta: IMetaInfo): string;
}

export class ErrorFormatterJIT implements IErrorFormatter {
   private readonly title: string;

   constructor(title: string) {
      this.title = title;
   }

   debug(message: string, meta: IMetaInfo): string {
      return this.decorateMessage(message, meta);
   }

   info(message: string, meta: IMetaInfo): string {
      return this.decorateMessage(message, meta);
   }

   warn(message: string, meta: IMetaInfo): string {
      return this.decorateMessage(message, meta);
   }

   error(message: string, meta: IMetaInfo): string {
      return this.decorateMessage(message, meta);
   }

   critical(message: string, meta: IMetaInfo): string {
      return this.decorateMessage(message, meta);
   }

   fatal(message: string, meta: IMetaInfo): string {
      return this.decorateMessage(message, meta);
   }

   private decorateMessage(message: string, meta: IMetaInfo): string {
      let decoratedMessage = `${this.title}: `;
      if (meta.fileName) {
         decoratedMessage += `${meta.fileName} `;
      }
      if (meta.position) {
         decoratedMessage += `(${meta.position.line + 1}:${meta.position.column + 1}) `;
      }
      decoratedMessage += message;
      return decoratedMessage;
   }
}

export class ErrorFormatterAOT implements IErrorFormatter {
   private readonly title: string;

   constructor(title: string) {
      this.title = title;
   }

   debug(message: string, meta: IMetaInfo): string {
      return this.decorateMessage(message, meta);
   }

   info(message: string, meta: IMetaInfo): string {
      return this.decorateMessage(message, meta);
   }

   warn(message: string, meta: IMetaInfo): string {
      return this.decorateMessage(message, meta);
   }

   error(message: string, meta: IMetaInfo): string {
      return this.decorateMessage(message, meta);
   }

   critical(message: string, meta: IMetaInfo): string {
      return this.decorateMessage(message, meta);
   }

   fatal(message: string, meta: IMetaInfo): string {
      return this.decorateMessage(message, meta);
   }

   private decorateMessage(message: string, meta: IMetaInfo): string {
      let decoratedMessage = `${this.title}: ${message}`;
      if (meta.position) {
         decoratedMessage += `. Строка: ${meta.position.line + 1}, столбец: ${meta.position.column + 1}`;
      }
      return decoratedMessage;
   }
}

export interface IErrorHandler {
   debug(message: string, meta: IMetaInfo): void;
   info(message: string, meta: IMetaInfo): void;
   warn(message: string, meta: IMetaInfo): void;
   error(message: string, meta: IMetaInfo): void;
   critical(message: string, meta: IMetaInfo): void;
   fatal(message: string, meta: IMetaInfo): void;
   hasFailures(): boolean;
   popLastErrorMessage(): string;
   flush(): void;
}

export class ErrorHandler implements IErrorHandler {
   private hasFailureDiagnostics: boolean;
   private readonly logger: ILogger;
   private readonly formatter: IErrorFormatter;

   constructor(logger: ILogger, formatter: IErrorFormatter) {
      this.hasFailureDiagnostics = false;
      this.logger = logger;
      this.formatter = formatter;
   }

   debug(message: string, meta: IMetaInfo): void {
      this.logger.log(this.formatter.debug(message, meta));
   }

   info(message: string, meta: IMetaInfo): void {
      this.logger.log(this.formatter.info(message, meta));
   }

   warn(message: string, meta: IMetaInfo): void {
      this.logger.warn(this.formatter.warn(message, meta));
   }

   error(message: string, meta: IMetaInfo): void {
      this.logger.error(this.formatter.error(message, meta));
   }

   critical(message: string, meta: IMetaInfo): void {
      this.hasFailureDiagnostics = true;
      this.logger.error(this.formatter.critical(message, meta));
   }

   fatal(message: string, meta: IMetaInfo): void {
      this.hasFailureDiagnostics = true;
      this.logger.error(this.formatter.fatal(message, meta));
   }

   hasFailures(): boolean {
      return this.hasFailureDiagnostics;
   }

   popLastErrorMessage(): string {
      return this.logger.popLastErrorMessage();
   }

   flush(): void {
      this.logger.flush();
   }
}

const COMPILER_DIAGNOSTIC_TITLE = 'Template Compiler';

export function createErrorHandler(isJIT: boolean, title: string = COMPILER_DIAGNOSTIC_TITLE): IErrorHandler {
   if (isJIT) {
      const logger = new StackLogger();
      const formatter = new ErrorFormatterJIT(title);
      return new ErrorHandler(logger, formatter);
   }
   const logger = new Logger();
   const formatter = new ErrorFormatterAOT(title);
   return new ErrorHandler(logger, formatter);
}
