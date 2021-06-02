import { createElement, Component, ReactElement } from 'react';
import { TErrBoundaryOptions, IErrorConfig } from 'UICore/_base/interfaces';
import { ErrorContainer } from 'UICore/_base/ErrorContainer';


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
        // возвращаем пока всегда один и тот же конфиг
        return Promise.resolve({
            _errorMessage: 'Что-то пошло не так',
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
