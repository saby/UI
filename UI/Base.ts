/// <amd-module name="UI/Index" />
import {default as Control, IControlOptions, TemplateFunction} from './_base/Control';
import HTML from './_base/HTML';
import Document from './_base/Document';
import StateReceiver from './_base/StateReceiver';

import AppData from './_base/Deprecated/AppData';
import Start from './_base/Start';
import HeadController from './_base/HeadController';

//@ts-ignore
import BaseRoute = require('wml!UI/_base/Route');
import Creator, { async as AsyncCreator } from './_base/Creator';

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
    TemplateFunction
};
