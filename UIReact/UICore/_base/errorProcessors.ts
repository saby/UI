import { createElement, Component, ReactElement } from 'react';
import { getResourceUrl } from 'UICommon/Utils';

/**
 * Интерфейс для конфига ошибки
 */
export interface IErrorConfig {
    _errorMessage: string;
    templateName: string;
    error?: Error;
}

/**
 * Интерфейс пропсов для Компонентов errorProcessors
 */
interface TErrBoundaryOptions {
    error?: Error;
    errorConfig?: IErrorConfig;
    theme?: string;
}

/**
 * Error Controller, который должен обрабатывать поступающие ошибки,
 * и возвращать в зависимости от ошибки нужный конфиг с ошибкой.
 */
export class ErrorController extends Component <TErrBoundaryOptions, {errorConfig: IErrorConfig}> {
    constructor(props: TErrBoundaryOptions) {
        super(props);
        this.state = {
            errorConfig: undefined
        };
    }
    proccess(error: Error): Promise<IErrorConfig> {
        return Promise.resolve({
            _errorMessage: 'Что-то пошло не так',
            templateName: 'Default/Template',
            error
        });
    }
    componentDidMount(): void {
        this.proccess(this.props.error)
            .then((cfg: IErrorConfig) => {
                this.setState({errorConfig: cfg});
            });
    }
    render(): ReactElement {
        return (
            this.state.errorConfig
                ? createElement(ErrorContainer, { theme: this.props.theme, errorConfig: this.state.errorConfig })
                : null
        );
    }
}

/**
 * ErrorContainer должен принимать конфиг с ошибкой и возвращать нужный шаблон.
 */
class ErrorContainer extends Component<TErrBoundaryOptions> {

    getTemplate(): ReactElement {
        // здесь должен быть код который принимает errorConfig,
        // обрабатывает их и возвращает template.
        // Пока опустим часть обработки и будем всегда возвращать default template.
        return createElement(DefaultTemplate, {theme: this.props.theme, errorConfig: this.props.errorConfig});
    }
    render(): ReactElement {
        return this.getTemplate();
    }
}

/**
 * DefaultTemplate - Дефолтный шаблон с ошибкой
 */
class DefaultTemplate extends Component<TErrBoundaryOptions> {
    render(): ReactElement {
        return createElement('div',{
            style: {
                border: '1px solid red',
                padding: '50px',
                maxWidth: '30%',
                margin: '0 auto',
                textAlign: 'center'
            }
        }, [
            createElement('img', { key: 'e1',
                style: {
                    maxWidth: '100%',
                    maxHeight: '200px',
                    marginBottom: '20px'
                },
                src: getResourceUrl(
                    `/cdn/Maintenance/1.1.0/img/NOT_FOUND_${this.props?.theme}.svg`)
            }),
            createElement('div', { key: 'e2' }, this.props.errorConfig._errorMessage)
        ]);
    }
}
