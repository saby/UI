import { IErrorConfig } from 'UICore/_base/interfaces';


/**
 * ErrorController, возвращает всегда один и тот же дефолтный шаблон.
 */
export class ErrorViewer {
    static process(error?: Error): IErrorConfig {
        // возвращаем пока всегда один и тот же конфиг
        return {
            _errorMessage: 'Что-то пошло не так',
            error
        };
    }
}

// использовать только для теста
export class AsyncErrorViewer {
    static process(error?: Error): Promise<IErrorConfig> {
        // возвращаем пока всегда один и тот же конфиг
        return Promise.resolve({
            _errorMessage: 'Что-то пошло не так',
            error
        });
    }
}
