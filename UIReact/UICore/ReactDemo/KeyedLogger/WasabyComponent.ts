import { Control } from 'UICore/Base';
import { TemplateFunction, IControlOptions } from 'UICommon/Base';
import * as template from 'wml!UICore/ReactDemo/KeyedLogger/WasabyComponent';
import { KeyedLogger } from 'UICore/Logger';

export default class KeyedLoggerWasabyComponent extends Control {
    _template: TemplateFunction = template;
    _beforeMount(options: IControlOptions): void {
        // Здесь это для примера, при использовании в WasabyOverReact будем звать из render
        // Извлекаем серверные ошибки по платформенному ключу
        KeyedLogger.extractServerMessages(options.rskey);

        KeyedLogger.error('Я ошибка из Wasaby компонента', options.rskey);
        KeyedLogger.warn('Я предупреждение из Wasaby компонента', options.rskey);
        KeyedLogger.info('Я информация из Wasaby компонента');
        KeyedLogger.log('Я лог из Wasaby компонента');
    }
}
