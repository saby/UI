/**
 * @description Represents itnerfaces, methods and classes to print diagnostic messages.
 * @author Крылов М.А.
 * @file Compiler/utils/ErrorHandler.ts
 */

// @ts-ignore
import { IoC } from 'Env/Env';
import { SourcePosition } from 'Compiler/html/Reader';

/**
 * Print log diagnostic message.
 * @param message {string} Diagnostic message.
 */
function log(message: string): void {
   IoC.resolve('ILogger').log(message);
}

/**
 * Print warning diagnostic message.
 * @param message {string} Diagnostic message.
 */
function warn(message: string): void {
   IoC.resolve('ILogger').warn(message);
}

/**
 * Print error diagnostic message.
 * @param message {string} Diagnostic message.
 */
function error(message: string): void {
   IoC.resolve('ILogger').error(message);
}

/**
 * Interface for logger.
 */
export interface ILogger {

   /**
    * Print log diagnostic message.
    * @param message {string} Diagnostic message.
    */
   log(message: string): void;

   /**
    * Print warning diagnostic message.
    * @param message {string} Diagnostic message.
    */
   warn(message: string): void;

   /**
    * Print error diagnostic message.
    * @param message {string} Diagnostic message.
    */
   error(message: string): void;

   /**
    * Pop last error diagnostic message.
    */
   popLastErrorMessage(): string;

   /**
    * Flush all diagnostic messages.
    */
   flush(): void;
}

/**
 * Simple logger. All processed diagnostic messages will be printed immediately.
 */
export class Logger implements ILogger {

   /**
    * Print log diagnostic message.
    * @param message {string} Diagnostic message.
    */
   log(message: string): void {
      log(message);
   }

   /**
    * Print warning diagnostic message.
    * @param message {string} Diagnostic message.
    */
   warn(message: string): void {
      warn(message);
   }

   /**
    * Print error diagnostic message.
    * @param message {string} Diagnostic message.
    */
   error(message: string): void {
      error(message);
   }

   /**
    * Pop last error diagnostic message.
    */
   popLastErrorMessage(): string {
      return null;
   }

   /**
    * Flush all diagnostic messages.
    */
   flush(): void { }
}

/**
 * Diagnostic message type.
 */
enum MessageType {

   /**
    * Log diagnostic messages.
    */
   LOG,

   /**
    * Warning diagnostic messages.
    */
   WARN,

   /**
    * Error diagnostic messages.
    */
   ERROR
}

/**
 * Interface for diagnostic message.
 */
interface IMessage {

   /**
    * Message type.
    */
   type: MessageType;

   /**
    * Message text.
    */
   message: string;
}

/**
 * Stack logger. All processed diagnostic messages will be printed all in one in flush method.
 */
export class StackLogger implements ILogger {

   /**
    * Stack of processed diagnostic messages.
    */
   private readonly stack: IMessage[];

   /**
    * Initialize new instance of logger.
    */
   constructor() {
      this.stack = [];
   }

   /**
    * Print log diagnostic message.
    * @param message {string} Diagnostic message.
    */
   log(message: string): void {
      this.stack.push({
         type: MessageType.LOG,
         message
      });
   }

   /**
    * Print warning diagnostic message.
    * @param message {string} Diagnostic message.
    */
   warn(message: string): void {
      this.stack.push({
         type: MessageType.WARN,
         message
      });
   }

   /**
    * Print error diagnostic message.
    * @param message {string} Diagnostic message.
    */
   error(message: string): void {
      this.stack.push({
         type: MessageType.ERROR,
         message
      });
   }

   /**
    * Pop last error diagnostic message.
    */
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

   /**
    * Flush all diagnostic messages.
    */
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

/**
 * Interface for auxiliary diagnostic info.
 */
export interface IMetaInfo {

   /**
    * Processing template file name.
    */
   fileName?: string;

   /**
    * Zero-based position in source template file.
    */
   position?: SourcePosition;
}

/**
 * Formatter for diagnostic messages.
 */
export interface IErrorFormatter {

   /**
    * Format debug message.
    * @param message {string} Message text.
    * @param meta {IMetaInfo} Auxiliary diagnostic info.
    */
   debug(message: string, meta: IMetaInfo): string;

   /**
    * Format info message.
    * @param message {string} Message text.
    * @param meta {IMetaInfo} Auxiliary diagnostic info.
    */
   info(message: string, meta: IMetaInfo): string;

   /**
    * Format warning message.
    * @param message {string} Message text.
    * @param meta {IMetaInfo} Auxiliary diagnostic info.
    */
   warn(message: string, meta: IMetaInfo): string;

   /**
    * Format error message.
    * @param message {string} Message text.
    * @param meta {IMetaInfo} Auxiliary diagnostic info.
    */
   error(message: string, meta: IMetaInfo): string;

   /**
    * Format critical message.
    * @param message {string} Message text.
    * @param meta {IMetaInfo} Auxiliary diagnostic info.
    */
   critical(message: string, meta: IMetaInfo): string;

   /**
    * Format fatal message.
    * @param message {string} Message text.
    * @param meta {IMetaInfo} Auxiliary diagnostic info.
    */
   fatal(message: string, meta: IMetaInfo): string;
}

/**
 * Diagnostic message decorator type.
 */
declare type TDecoratorFunction = (title: string, message: string, meta: IMetaInfo) => string;

/**
 * Diagnostic message formatter for compiler.
 */
export class ErrorFormatter implements IErrorFormatter {

   /**
    * Diagnostic message title.
    */
   private title: string;

   /**
    * Diagnostic message decorator.
    */
   private decorator: TDecoratorFunction;


   /**
    * Initialize new instance of diagnostic message formatter.
    * @param title {string} Diagnostic message title.
    * @param decorator {TDecoratorFunction} Diagnostic message decorator.
    */
   constructor(title: string, decorator: TDecoratorFunction) {
      this.title = title;
      this.decorator = decorator;
   }

   /**
    * Format debug message.
    * @param message {string} Message text.
    * @param meta {IMetaInfo} Auxiliary diagnostic info.
    */
   debug(message: string, meta: IMetaInfo): string {
      return this.decorator(this.title, message, meta);
   }

   /**
    * Format info message.
    * @param message {string} Message text.
    * @param meta {IMetaInfo} Auxiliary diagnostic info.
    */
   info(message: string, meta: IMetaInfo): string {
      return this.decorator(this.title, message, meta);
   }

   /**
    * Format warning message.
    * @param message {string} Message text.
    * @param meta {IMetaInfo} Auxiliary diagnostic info.
    */
   warn(message: string, meta: IMetaInfo): string {
      return this.decorator(this.title, message, meta);
   }

   /**
    * Format error message.
    * @param message {string} Message text.
    * @param meta {IMetaInfo} Auxiliary diagnostic info.
    */
   error(message: string, meta: IMetaInfo): string {
      return this.decorator(this.title, message, meta);
   }

   /**
    * Format critical message.
    * @param message {string} Message text.
    * @param meta {IMetaInfo} Auxiliary diagnostic info.
    */
   critical(message: string, meta: IMetaInfo): string {
      return this.decorator(this.title, message, meta);
   }

   /**
    * Format fatal message.
    * @param message {string} Message text.
    * @param meta {IMetaInfo} Auxiliary diagnostic info.
    */
   fatal(message: string, meta: IMetaInfo): string {
      return this.decorator(this.title, message, meta);
   }
}

/**
 * Decorate diagnostic message for JIT compile mode.
 * @param title {string} Compiler diagnostic message title.
 * @param message {string} Diagnostic message text.
 * @param meta {IMetaInfo} Meta information object.
 */
function decorateMessageJIT(title: string, message: string, meta: IMetaInfo): string {
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
 * Decorate diagnostic message for AOT compile mode.
 * @param title {string} Compiler diagnostic message title.
 * @param message {string} Diagnostic message text.
 * @param meta {IMetaInfo} Meta information object.
 */
function decorateMessageAOT(title: string, message: string, meta: IMetaInfo): string {
   let decoratedMessage = `${title}: ${message}`;
   if (meta.position) {
      decoratedMessage += `. Строка: ${meta.position.line + 1}, столбец: ${meta.position.column + 1}`;
   }
   return decoratedMessage;
}

/**
 * Interface for error handler.
 */
export interface IErrorHandler {

   /**
    * Process debug diagnostic message.
    * @param message {string} Message text.
    * @param meta {string} Auxiliary diagnostic info.
    */
   debug(message: string, meta: IMetaInfo): void;

   /**
    * Process info diagnostic message.
    * @param message {string} Message text.
    * @param meta {string} Auxiliary diagnostic info.
    */
   info(message: string, meta: IMetaInfo): void;

   /**
    * Process warning diagnostic message.
    * @param message {string} Message text.
    * @param meta {string} Auxiliary diagnostic info.
    */
   warn(message: string, meta: IMetaInfo): void;

   /**
    * Process error diagnostic message.
    * @param message {string} Message text.
    * @param meta {string} Auxiliary diagnostic info.
    */
   error(message: string, meta: IMetaInfo): void;

   /**
    * Process critical diagnostic message.
    * @param message {string} Message text.
    * @param meta {string} Auxiliary diagnostic info.
    */
   critical(message: string, meta: IMetaInfo): void;

   /**
    * Process fatal diagnostic message.
    * @param message {string} Message text.
    * @param meta {string} Auxiliary diagnostic info.
    */
   fatal(message: string, meta: IMetaInfo): void;

   /**
    * Check for processed critical and fatal errors.
    */
   hasFailures(): boolean;

   /**
    * Pop last error, fatal or critical message text.
    */
   popLastErrorMessage(): string;

   /**
    * Flush all data.
    */
   flush(): void;
}

/**
 * Represents methods to process diagnostic messages.
 */
export class ErrorHandler implements IErrorHandler {

   /**
    * Flag for processed critical and fatal messages.
    */
   private hasFailureDiagnostics: boolean;

   /**
    * Concrete logger instance.
    */
   private readonly logger: ILogger;

   /**
    * Concrete message formatter.
    */
   private readonly formatter: IErrorFormatter;

   /**
    * Initialize new instance of error formatter.
    * @param logger {ILogger} Concrete logger.
    * @param formatter {IErrorFormatter} Concrete message formatter.
    */
   constructor(logger: ILogger, formatter: IErrorFormatter) {
      this.hasFailureDiagnostics = false;
      this.logger = logger;
      this.formatter = formatter;
   }

   /**
    * Process debug diagnostic message.
    * @param message {string} Message text.
    * @param meta {string} Auxiliary diagnostic info.
    */
   debug(message: string, meta: IMetaInfo): void {
      this.logger.log(this.formatter.debug(message, meta));
   }

   /**
    * Process info diagnostic message.
    * @param message {string} Message text.
    * @param meta {string} Auxiliary diagnostic info.
    */
   info(message: string, meta: IMetaInfo): void {
      this.logger.log(this.formatter.info(message, meta));
   }

   /**
    * Process warning diagnostic message.
    * @param message {string} Message text.
    * @param meta {string} Auxiliary diagnostic info.
    */
   warn(message: string, meta: IMetaInfo): void {
      this.logger.warn(this.formatter.warn(message, meta));
   }

   /**
    * Process error diagnostic message.
    * @param message {string} Message text.
    * @param meta {string} Auxiliary diagnostic info.
    */
   error(message: string, meta: IMetaInfo): void {
      this.logger.error(this.formatter.error(message, meta));
   }

   /**
    * Process critical diagnostic message.
    * @param message {string} Message text.
    * @param meta {string} Auxiliary diagnostic info.
    */
   critical(message: string, meta: IMetaInfo): void {
      this.hasFailureDiagnostics = true;
      this.logger.error(this.formatter.critical(message, meta));
   }

   /**
    * Process fatal diagnostic message.
    * @param message {string} Message text.
    * @param meta {string} Auxiliary diagnostic info.
    */
   fatal(message: string, meta: IMetaInfo): void {
      this.hasFailureDiagnostics = true;
      this.logger.error(this.formatter.fatal(message, meta));
   }

   /**
    * Check for processed critical and fatal errors.
    */
   hasFailures(): boolean {
      return this.hasFailureDiagnostics;
   }

   /**
    * Pop last error, fatal or critical message text.
    */
   popLastErrorMessage(): string {
      return this.logger.popLastErrorMessage();
   }

   /**
    * Flush all data.
    */
   flush(): void {
      this.logger.flush();
   }
}

/**
 * Default compiler title.
 */
const COMPILER_DIAGNOSTIC_TITLE = 'Template Compiler';

/**
 * Create error handler.
 * @param isJIT {boolean} Flag for JIT compile mode.
 * @param title {string} Diagnostic messages title.
 * @returns {IErrorHandler} Returns error handler.
 */
export function createErrorHandler(isJIT: boolean, title: string = COMPILER_DIAGNOSTIC_TITLE): IErrorHandler {
   if (isJIT) {
      const logger = new Logger();
      const formatter = new ErrorFormatter(title, decorateMessageJIT);
      return new ErrorHandler(logger, formatter);
   }
   const logger = new StackLogger();
   const formatter = new ErrorFormatter(title, decorateMessageAOT);
   return new ErrorHandler(logger, formatter);
}
