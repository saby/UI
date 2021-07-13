/**
 * Часть библиотеки UI/Base, общая для React и Wasaby.
 */

import BootstrapStart from './BootstrapStart';
import { HeadData, headDataStore } from 'UICommon/Deps';
import { getGeneratorConfig } from 'UICore/Base';

//@ts-ignore
import {IHTMLOptions, IHTML} from './interface/IHTML';
import {IRootTemplateOptions, IRootTemplate} from './interface/IRootTemplate';
import Creator, { async as AsyncCreator } from './Creator';
export { startApplication } from 'UICore/Base';
export { default as TagMarkup } from 'UI/_base/_meta/TagMarkup';
export { fromJML } from 'UI/_base/_meta/JsonML';

//#region meta data
import * as meta from 'UI/_base/meta';
export { getMetaStack } from 'UI/_base/meta';
export { meta };
//#endregion

export {
   BootstrapStart,
   Creator,
   AsyncCreator,
   HeadData,
   headDataStore,
   IHTMLOptions,
   IHTML,
   IRootTemplateOptions,
   IRootTemplate,
   getGeneratorConfig
};
