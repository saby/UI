import { Component, ReactNode } from 'react';
import { KeyedLogger } from 'UICore/Logger';

export default class KeyedLoggerIncorrectReactComponent extends Component {
    render(): ReactNode {
        // Не извлекаем серверные ошибки
        KeyedLogger.error('Я ошибка из неправильного React компонента', 'IncorrectReactComponent');
        KeyedLogger.warn('Я предупреждение из неправильного React компонента', 'IncorrectReactComponent');
        KeyedLogger.info('Я информация из неправильного React компонента');
        KeyedLogger.log('Я лог из неправильного React компонента');

        return <div>IncorrectReactComponent</div>;
    }
}
