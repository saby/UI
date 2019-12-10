/**
 * Библиотека базового контрола
 * @library UI/Base
 * @includes Control UI/_base/Control
 * @public
 * @author Шипин А.А.
 */
import {default as Control, IControlOptions, TemplateFunction} from './_base/Control';
import HTML from './_base/HTML';
import Document from './_base/Document';
import StateReceiver from './_base/StateReceiver';

import AppData from './_base/AppData';
import Start from './_base/Start';
import HeadController from './_base/HeadController';
import HeadData from './_base/HeadData';
import {DepsCollector} from './_base/DepsCollector';
import SwipeController from './_base/MobileTouchEvent/SwipeController';
import LongTapController from './_base/MobileTouchEvent/LongTapController';

//@ts-ignore
import BaseRoute = require('wml!UI/_base/Route');
import {IHTMLOptions, IHTML} from './_base/interface/IHTML';
import {IRootTemplateOptions, IRootTemplate} from './_base/interface/IRootTemplate';
import Creator, { async as AsyncCreator } from './_base/Creator';
export { default as startApplication } from 'UI/_base/startApplication';

export {
    Control,
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
    TemplateFunction,
    SwipeController,
    LongTapController,
    IHTMLOptions,
    IHTML,
    IRootTemplateOptions,
    IRootTemplate
};
