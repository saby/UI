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

export { Control, IControlChildren, WasabyPortal } from 'UICore/Base';
export { IControlOptions, TemplateFunction } from 'UICommon/Base';

export { default as BootstrapStart } from 'UI/_base/BootstrapStart';
export { HeadData, headDataStore } from 'UICommon/Deps';
export { getGeneratorConfig } from 'UICore/Base';

export { default as Creator, async as AsyncCreator } from 'UI/_base/Creator';
export { startApplication } from 'UICore/Base';
export { default as TagMarkup } from 'UI/_base/_meta/TagMarkup';
export { fromJML } from 'UI/_base/_meta/JsonML';

//#region meta data
import * as meta from 'UI/_base/meta';
export { meta };
export { getMetaStack } from 'UI/_base/meta';
//#endregion
