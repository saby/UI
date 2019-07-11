/// <amd-module name="UI/Focus" />

import * as ElementFinder from './_focus/ElementFinder';
import * as Events from './_focus/Events';
import * as BoundaryElements from './_focus/BoundaryElements';
import { focus } from './_focus/Focus';
import { activate } from './_focus/Activate';
import { preventFocus } from './_focus/PreventFocus';
import { restoreFocus } from './_focus/RestoreFocus';

export {
   ElementFinder,
   Events,
   BoundaryElements,
   focus,
   activate,
   preventFocus,
   restoreFocus
};
