import { Control } from 'UICore/Base';
import { TemplateFunction } from 'UICommon/Base';
import * as template from 'wml!UICore/ReactDemo/KeyedLogger/Index';
import { KeyedLogger } from 'UICore/Logger';

export default class KeyedLoggerIndex extends Control {
    _template: TemplateFunction = template;
    _beforeMount(): void {
        KeyedLogger.init();
    }
} 
