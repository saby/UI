import { Component, ReactNode } from 'react';
import { KeyedLogger } from 'UICore/Logger';

export default class KeyedLoggerCorrectReactComponent extends Component {
    render(): ReactNode {
        // Извлекаем серверные ошибки, ключ совпадает
        KeyedLogger.extractServerMessages('CorrectReactComponent');

        KeyedLogger.error('Я ошибка из правильного React компонента', 'CorrectReactComponent');
        KeyedLogger.warn('Я предупреждение из правильного React компонента', 'CorrectReactComponent');
        KeyedLogger.info('Я информация из правильного React компонента');
        KeyedLogger.log('Я лог из правильного React компонента');

        return <div>CorrectReactComponent</div>;
    }
}
