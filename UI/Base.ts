/**
 * Библиотека базового контрола
 * @library UI/Base
 * @includes Control UICore/_base/Control
 * @includes HTML UI/_base/HTML
 * @includes IMetaStack UI/_base/HTML/_meta/IMetaStack
 * @includes IMetaState UI/_base/HTML/_meta/IMetaState
 * @includes IMeta UI/_base/HTML/_meta/IMeta
 * @includes IOpenGraph UI/_base/HTML/_meta/IOpenGraph
 * @includes Creator UI/_base/Creator
 * @includes Async UI/_async/Async
 * @public
 * @author Шипин А.А.
 */
export { default as Control, IControlOptions, TemplateFunction, IControlChildren } from 'UICore/Base';
export { IMetaStack, IMetaState, IMeta, IOpenGraph } from 'UI/_base/HTML/meta';
export * from './_base/CommonLib';
