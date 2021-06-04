export interface IControlState {
   loading: boolean;
   observableVersion: number;
   hasError?: boolean;
   error?: Error;
   errorConfig?: IErrorConfig;
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
 * Интерфейс пропсов для Компонентов ErrorContainer, ErrorController
 */
export interface TErrBoundaryOptions {
   error?: Error;
   errorConfig?: IErrorConfig;
   theme?: string;
}
export interface IErrorViewer {
   process(error: Error): Promise<IErrorConfig | void> | IErrorConfig;
}
