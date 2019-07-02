// @ts-ignore
import { Control } from 'UI/Base';
// @ts-ignore
import template = require('wml!UI/_hotKeys/KeyStop');

import { SyntheticEvent } from 'Vdom/Vdom';

class KeyStop extends Control {
   _keydownHandler(event: SyntheticEvent): void {
      event.stopped = true;
   }
}

// @ts-ignore
KeyStop.prototype._template = template;

export default KeyStop;
