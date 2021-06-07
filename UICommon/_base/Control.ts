import { IGeneratorConfig } from 'UICommon/Executor';
import { IErrorViewer } from 'UICore/Base';
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
    errorViewer?: IErrorViewer;
    _$attributes?: object;
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
