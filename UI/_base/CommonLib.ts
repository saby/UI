/**
 * Часть библиотеки UI/Base, общая для React и Wasaby.
 */
import HTML from './HTML';
import Document from './Document';

import AppData from './AppData';
import Start from './Start';
import BootstrapStart from './BootstrapStart';
import BootstrapStartApplicationScript from './HTML/BootstrapStartApplicationScript';
import HeadController from './HeadController';
import { HeadData, headDataStore, DepsCollector } from 'UI/Deps';
import { getGeneratorConfig } from './GeneratorConfig';

//@ts-ignore
import * as BaseRoute from 'wml!UI/_base/Route';
import {IHTMLOptions, IHTML} from './interface/IHTML';
import {IRootTemplateOptions, IRootTemplate} from './interface/IRootTemplate';
import Creator, { async as AsyncCreator } from './Creator';
export { default as startApplication } from 'UI/_base/startApplication';
export { default as TagMarkup } from 'UI/_base/HTML/_meta/TagMarkup';
export { fromJML } from 'UI/_base/HTML/_meta/JsonML';

//#region meta data
export { getMetaStack, IMeta, IMetaState } from 'UI/_base/HTML/meta';
//#endregion

export { PrefetchLinksStore } from 'UI/Deps';
export { default as Async, IAsyncOptions, TAsyncStateReceived } from 'UI/_async/Async';

export {
   HTML,
   Document,
   AppData,
   Start,
   BootstrapStart,
   BootstrapStartApplicationScript,
   BaseRoute,
   HeadController,
   Creator,
   AsyncCreator,
   DepsCollector,
   HeadData,
   headDataStore,
   IHTMLOptions,
   IHTML,
   IRootTemplateOptions,
   IRootTemplate,
   getGeneratorConfig
};
