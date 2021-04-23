
import { Control } from 'UICore/Base';

/**
 * Интерфейс опций базового контрола
 * @interface UICommon/_base/Control#IControlOptions
 * @public
 */
export interface IControlOptions {
    readOnly?: boolean;
    theme?: string;
    notLoadThemes?: boolean,
    _$createdFromCode?: boolean;
}


/**
 * Тип детей базового контрола, то есть поля _children
 * @typedef UICommon/_base/Control#IControlChildren
 * @public
 */
export type IControlChildren = Record<string, Element | Control | Control<IControlOptions, {}>>;
