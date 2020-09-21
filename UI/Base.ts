/**
 * Библиотека базового контрола
 * @library UI/Base
 * @includes Control UI/_base/Control
 * @includes getMetaStack UI/_base/HTML/meta#getMetaStack
 * @public
 * @author Шипин А.А.
 */
import {default as Control, IControlOptions, TemplateFunction} from './_base/Control';
import HTML from './_base/HTML';
import Document from './_base/Document';
import StateReceiver from './_state/StateReceiver';

import AppData from './_base/AppData';
import Start from './_base/Start';
import HeadController from './_base/HeadController';
import HeadData, { headDataStore } from 'UI/_base/HeadData';
import {DepsCollector} from './_base/DepsCollector';

import { createTemplate as createWmlTemplate, loadModule } from './_base/Templates/Wml';
import { createTemplate as createTmplTemplate } from './_base/Templates/Tmpl';

//@ts-ignore
import BaseRoute = require('wml!UI/_base/Route');
import {IHTMLOptions, IHTML} from './_base/interface/IHTML';
import {IRootTemplateOptions, IRootTemplate} from './_base/interface/IRootTemplate';
import Creator, { async as AsyncCreator } from './_base/Creator';
export { default as startApplication } from 'UI/_base/startApplication';

//#region meta data
export { getMetaStack, IMeta, IMetaState } from 'UI/_base/HTML/meta';
//#endregion

export {
    Control,
    createTmplTemplate,
    createWmlTemplate,
    loadModule,
    IControlOptions,
    HTML,
    Document,
    StateReceiver,
    AppData,
    Start,
    BaseRoute,
    HeadController,
    Creator,
    AsyncCreator,
    DepsCollector,
    HeadData,
    headDataStore,
    TemplateFunction,
    IHTMLOptions,
    IHTML,
    IRootTemplateOptions,
    IRootTemplate
};
