import {IErrorConfig, TErrBoundaryOptions} from 'UICore/_base/interfaces';
import {Component, createElement, ReactElement} from "react";
import {getResourceUrl} from 'UICommon/Utils';


/**
 * ErrorViewer, возвращает всегда один и тот же дефолтный шаблон.
 */
export class ErrorViewer extends Component<TErrBoundaryOptions> {
    static process(error?: Error): IErrorConfig {
        // возвращаем пока всегда один и тот же конфиг
        return {
            _errorMessage: 'Что-то пошло не так',
            error
        };
    }
    render(): ReactElement {
        return createElement('div',{
            key: 'e1',
            style: {
                border: '1px solid red',
                padding: '50px',
                maxWidth: '30%',
                margin: '0 auto',
                textAlign: 'center'
            }
        }, [
            createElement('img', { key: 'e11',
                style: {
                    maxWidth: '100%',
                    maxHeight: '200px',
                    marginBottom: '20px'
                },
                src: getResourceUrl(
                    `/cdn/Maintenance/1.1.0/img/NOT_FOUND_${this.props?.theme}.svg`)
            }),
            createElement('div', {key: 'e12'}, this.props.errorConfig._errorMessage)
        ]);
    }
}

// использовать только для теста
export class AsyncErrorViewer extends Component<TErrBoundaryOptions> {
    static process(error?: Error): Promise<IErrorConfig> {
        // возвращаем пока всегда один и тот же конфиг
        return Promise.resolve({
            _errorMessage: 'Что-то пошло не так',
            error
        });
    }
    render(): ReactElement {
        return createElement('div',{
            key: 'e1',
            style: {
                border: '1px solid red',
                padding: '50px',
                maxWidth: '30%',
                margin: '0 auto',
                textAlign: 'center'
            }
        }, [
            createElement('img', { key: 'e11',
                style: {
                    maxWidth: '100%',
                    maxHeight: '200px',
                    marginBottom: '20px'
                },
                src: getResourceUrl(
                    `/cdn/Maintenance/1.1.0/img/NOT_FOUND_${this.props?.theme}.svg`)
            }),
            createElement('div', {key: 'e12'}, this.props.errorConfig._errorMessage)
        ]);
    }
}
