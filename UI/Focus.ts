/**
 * Библиотека фокусов
 * @library UI/Focus
 * @includes Focus UI/_focus/Focus
 * @includes Activate UI/_focus/Activate
 * @public
 * @author Кондаков Р.Н.
 */

import * as ElementFinder from './_focus/ElementFinder';
import * as Events from './_focus/Events';
import * as BoundaryElements from './_focus/BoundaryElements';
import { focus, _initFocus, nativeFocus } from './_focus/Focus';
import { activate } from './_focus/Activate';
import { preventFocus, hasNoFocus } from './_focus/PreventFocus';
import { restoreFocus, subscribeRestoreFocus } from './_focus/RestoreFocus';
import { prepareRestoreFocusBeforeRedraw, restoreFocusAfterRedraw } from './_focus/RestoreFocus';

import { goUpByControlTree } from 'UI/NodeCollector';
import * as DefaultOpenerFinder from './_focus/DefaultOpenerFinder';
import * as FocusAttrs from './_focus/FocusAttrs';
import { IControl } from './_focus/IControl';

export {
   ElementFinder,
   Events,
   BoundaryElements,
   focus,
   prepareRestoreFocusBeforeRedraw,
   restoreFocusAfterRedraw,
   _initFocus,
   IControl as _IControl,
   FocusAttrs as _FocusAttrs,
   nativeFocus,
   activate,
   preventFocus,
   hasNoFocus,
   restoreFocus,
   subscribeRestoreFocus,
   goUpByControlTree,
   DefaultOpenerFinder
};
