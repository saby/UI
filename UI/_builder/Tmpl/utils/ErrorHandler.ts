/// <amd-module name="UI/_builder/Tmpl/utils/ErrorHandler" />

// @ts-ignore
import { IoC } from 'Env/Env';
import { SourcePosition } from '../html/Reader';

/**
 *
 */
export interface IMetaInfo {

   /**
    *
    */
   fileName?: string;

   /**
    *
    */
   position?: SourcePosition;
}

/**
 *
 */
export interface ILogger {

   /**
    *
    * @param message {string}
    */
   log(message: string): void;

   /**
    *
    * @param message {string}
    */
   warn(message: string): void;

   /**
    *
    * @param message {string}
    */
   error(message: string): void;
}

/**
 *
 */
export class Logger implements ILogger {

   /**
    *
    * @param message {string}
    */
   log(message: string): void {
      IoC.resolve('ILogger').log(message);
   }

   /**
    *
    * @param message {string}
    */
   warn(message: string): void {
      IoC.resolve('ILogger').warn(message);
   }

   /**
    *
    * @param message {string}
    */
   error(message: string): void {
      IoC.resolve('ILogger').error(message);
   }
}

/**
 *
 */
export interface IErrorFormatter {

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   debug(message: string, meta: IMetaInfo): string;

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   info(message: string, meta: IMetaInfo): string;

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   warn(message: string, meta: IMetaInfo): string;

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   error(message: string, meta: IMetaInfo): string;

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   critical(message: string, meta: IMetaInfo): string;

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   fatal(message: string, meta: IMetaInfo): string;
}

/**
 *
 * @param meta {IMetaInfo}
 */
function calculateHeader(meta: IMetaInfo): string {
   let text = '';
   if (meta.fileName) {
      text += meta.fileName;
   }
   if (meta.position) {
      text += `(${meta.position.line + 1}:${meta.position.column + 1})`;
   }
   return `${text} `;
}

/**
 *
 */
export class MinimalErrorFormatter implements IErrorFormatter {

   /**
    *
    */
   private readonly title: string;

   /**
    *
    * @param title {string}
    */
   constructor(title: string = 'Template Compiler') {
      this.title = title;
   }

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   debug(message: string, meta: IMetaInfo): string {
      return `${this.title}: ${calculateHeader(meta)}${message}`;
   }

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   info(message: string, meta: IMetaInfo): string {
      return `${this.title}: ${calculateHeader(meta)}${message}`;
   }

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   warn(message: string, meta: IMetaInfo): string {
      return `${this.title}: ${calculateHeader(meta)}${message}`;
   }

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   error(message: string, meta: IMetaInfo): string {
      return `${this.title}: ${calculateHeader(meta)}${message}`;
   }

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   critical(message: string, meta: IMetaInfo): string {
      return `${this.title}: ${calculateHeader(meta)}${message}`;
   }

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   fatal(message: string, meta: IMetaInfo): string {
      return `${this.title}: ${calculateHeader(meta)}${message}`;
   }
}

/**
 *
 */
export interface IErrorHandler {

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   debug(message: string, meta: IMetaInfo): void;

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   info(message: string, meta: IMetaInfo): void;

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   warn(message: string, meta: IMetaInfo): void;

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   error(message: string, meta: IMetaInfo): void;

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   critical(message: string, meta: IMetaInfo): void;

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   fatal(message: string, meta: IMetaInfo): void;
}

/**
 *
 */
export default class ErrorHandler implements IErrorHandler {

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   private readonly logger: ILogger;

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   private readonly formatter: IErrorFormatter;

   /**
    *
    * @param logger {ILogger}
    * @param formatter {IErrorFormatter}
    */
   constructor(logger: ILogger = new Logger(), formatter: IErrorFormatter = new MinimalErrorFormatter()) {
      this.logger = logger;
      this.formatter = formatter;
   }

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   debug(message: string, meta: IMetaInfo): void {
      this.logger.log(this.formatter.debug(message, meta));
   }

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   info(message: string, meta: IMetaInfo): void {
      this.logger.log(this.formatter.info(message, meta));
   }

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   warn(message: string, meta: IMetaInfo): void {
      this.logger.warn(this.formatter.warn(message, meta));
   }

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   error(message: string, meta: IMetaInfo): void {
      this.logger.error(this.formatter.error(message, meta));
   }

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   critical(message: string, meta: IMetaInfo): void {
      this.logger.error(this.formatter.critical(message, meta));
   }

   /**
    *
    * @param message {string}
    * @param meta {IMetaInfo}
    */
   fatal(message: string, meta: IMetaInfo): void {
      this.logger.error(this.formatter.fatal(message, meta));
   }
}
