/**
 * Библиотека базового контрола
 * @library UI/Base
 * @includes Control UI/_base/Control
 * @includes HTML UI/_base/HTML
 * @includes getMetaStack UI/_base/HTML/meta#getMetaStack
 * @includes IMetaStack UI/_base/HTML/_meta/interface#IMetaStack
 * @includes IMetaState UI/_base/HTML/_meta/interface#IMetaState
 * @includes IMeta UI/_base/HTML/_meta/interface#IMeta
 * @includes IOpenGraph UI/_base/HTML/_meta/interface#IOpenGraph
 * @includes Creator UI/_base/Creator
 * @includes Async UI/_async/Async
 * @public
 * @author Шипин А.А.
 */
import {default as Control, IControlOptions, TemplateFunction, IControlChildren} from './_base/Control';
export { IMetaStack, IMetaState, IMeta, IOpenGraph } from 'UI/_base/HTML/meta';
export * from './_base/CommonLib';

export {
    Control,
    IControlOptions,
    TemplateFunction,
    IControlChildren
};
