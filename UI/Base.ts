/// <amd-module name="UI/Base" />
import {default as Control, IControlOptions, TemplateFunction} from './_base/Control';
import HTML from './_base/HTML';
import Document from './_base/Document';
import StateReceiver from './_base/StateReceiver';

import AppData from './_base/AppData';
import Start from './_base/Start';
import HeadController from './_base/HeadController';
import HeadData from './_base/HeadData';
import {DepsCollector} from './_base/DepsCollector';

//@ts-ignore
import BaseRoute = require('wml!UI/_base/Route');
import Creator, { async as AsyncCreator } from './_base/Creator';

import * as Logger from './_base/Logger';

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
    Logger
};
