import { IGeneratorConfig } from 'UICommon/Executor';
import * as React from 'react';

/**
 * Интерфейс опций базового контрола
 * @interface UICommon/_base/Control#IControlOptions
 * @property {String} rskey - ключ для сохранения/извлечения состояния из хранилища ReceivedState
 * @public
 */
export interface IControlOptions {
    readOnly?: boolean;
    theme?: string;
    notLoadThemes?: boolean;
    _$createdFromCode?: boolean;
    name?: string;
    rskey?: string;
    errorContainer?: React.ComponentClass;
    errorController?: IErrorViewer;
    _$attributes?: object;
    _$parentsChildrenPromises?: Promise<void>[];
}

/**
 * IErrorViewer необходим для отлова и показа ошибки в контроле WasabyOverReact
 */
interface IErrorViewer {
    process(error: Error): Promise<IErrorConfig | void> | IErrorConfig;
}

/**
 * Интерфейс для конфига ошибки для работы с ErrorViewer.
 */
interface IErrorConfig {
    _errorMessage: string;
    templateName?: string;
    error?: Error;
}

interface IStable {
    stable: boolean;
}

// TODO: в 3000 исправить тип возвращаемого значения. Только string для совместимости.
type TTemplateFunction = (
    data: object,
    attr?: object,
    context?: string,
    isVdom?: boolean,
    sets?: object,
    forceCompatible?: boolean,
    generatorConfig?: IGeneratorConfig
 ) => string;

/**
 * Тип шаблон-функции
 * @typedef UICommon/_base/Control#TemplateFunction
 * @public
 */
export type TemplateFunction = TTemplateFunction & IStable;
