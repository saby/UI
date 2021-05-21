/**
 * Библиотека базового контрола
 * @library UI/Base
 * @includes CoreBase UICore/Base
 * @includes CommonBase UICommon/Base
 * @includes HTML UI/_base/HTML
 * @includes Creator UI/_base/Creator
 * @includes meta UI/_base/HTML/meta
 * @includes getMetaStack UI/_base/HTML/meta
 * @public
 * @author Шипин А.А.
 */
//@ts-ignore
import * as BaseRoute from 'wml!UI/Route';
export { Control, IControlChildren } from 'UICore/Base';
export { IControlOptions, TemplateFunction } from 'UICommon/Base';
export * from './_base/CommonLib';
export {
   BaseRoute
};
