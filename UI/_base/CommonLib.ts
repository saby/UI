/**
 * Часть библиотеки UI/Base, общая для React и Wasaby.
 */
import HTML from './HTML';
import Document from './Document';

import Start from './Start';
import BootstrapStart from './BootstrapStart';
import HeadController from './HeadController';
import { HeadData, headDataStore } from 'UICommon/Deps';
import { getGeneratorConfig } from 'UICore/Base';

//@ts-ignore
import * as BaseRoute from 'wml!UI/_base/Route';
import {IHTMLOptions, IHTML} from './interface/IHTML';
import {IRootTemplateOptions, IRootTemplate} from './interface/IRootTemplate';
import Creator, { async as AsyncCreator } from './Creator';
export { startApplication } from 'UICore/Base';
export { default as TagMarkup } from 'UI/_base/HTML/_meta/TagMarkup';
export { fromJML } from 'UI/_base/HTML/_meta/JsonML';

//#region meta data
import * as meta from 'UI/_base/HTML/meta';
export { getMetaStack } from 'UI/_base/HTML/meta';
export { meta };
//#endregion

export {
   HTML,
   BaseRoute,
   Document,
   Start,
   BootstrapStart,
   HeadController,
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
