/// <amd-module name="UI/Focus" />

import * as ElementFinder from './_focus/ElementFinder';
import * as Events from './_focus/Events';
import * as BoundaryElements from './_focus/BoundaryElements';
import { focus, _initFocus } from './_focus/Focus';
import { activate } from './_focus/Activate';
import { preventFocus, hasNoFocus } from './_focus/PreventFocus';
import { restoreFocus } from './_focus/RestoreFocus';

import { goUpByControlTree } from './_focus/goUpByControlTree';
import * as DefaultOpenerFinder from './_focus/DefaultOpenerFinder';

export {
   ElementFinder,
   Events,
   BoundaryElements,
   focus,
   _initFocus,
   activate,
   preventFocus,
   hasNoFocus,
   restoreFocus,
   goUpByControlTree,
   DefaultOpenerFinder
};
