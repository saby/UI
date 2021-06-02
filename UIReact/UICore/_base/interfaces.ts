export interface IControlState {
   loading: boolean;
   observableVersion: number;
   hasError?: boolean;
   error?: void | Error;
   errorConfig: IErrorConfig;
}

/**
 * Интерфейс для конфига ошибки
 */
export interface IErrorConfig {
   _errorMessage: string;
   templateName?: string;
   error?: Error;
}

/**
 * Интерфейс пропсов для Компонентов errorProcessors
 */
export interface TErrBoundaryOptions {
   error?: Error;
   errorConfig?: IErrorConfig;
   theme?: string;
}
