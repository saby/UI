/// <amd-module name="UI/Vdom" />
/* tslint:disable */

import * as Debug from './_vdom/Synchronizer/resources/Debug';
import * as DirtyChecking from './_vdom/Synchronizer/resources/DirtyChecking';
import * as DirtyCheckingCompatible from './_vdom/Synchronizer/resources/DirtyCheckingCompatible';
import * as Hooks from './_vdom/Synchronizer/resources/Hooks';
import * as VdomMarkup from './_vdom/Synchronizer/resources/VdomMarkup';

import * as Functional from './_vdom/Utils/Functional';
import * as Monad from './_vdom/Utils/Monad';

import * as _Options from './_vdom/Synchronizer/resources/Options';
import * as _MountMethodsCaller from './_vdom/Synchronizer/resources/MountMethodsCaller';

export { isInvisibleNode } from './_vdom/Synchronizer/resources/InvisibleNodeChecker';

/**
 * @author Кондаков Р.Н.
 */
export { default as Synchronizer } from './_vdom/Synchronizer/Synchronizer';
export { Debug };
export { createInstance } from './_vdom/Synchronizer/resources/ControlNode';
export { DirtyChecking };
export { DirtyCheckingCompatible };
export { default as DOMEnvironment } from './_vdom/Synchronizer/resources/DOMEnvironment';
export { default as Environment } from './_vdom/Synchronizer/resources/Environment';
export { Hooks };
export { default as SyntheticEvent } from './_vdom/Synchronizer/resources/SyntheticEvent';
export { VdomMarkup };
export { _Options };
export { _MountMethodsCaller };

export { Functional, Monad };
