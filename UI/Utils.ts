/// <amd-module name="UI/Utils" />

/**
 * Библиотека служебных утилит для работы с UI Wasaby
 * @library UI/Utils
 * @includes Logger UI/_utils/Logger
 * @includes Purifier UI/_utils/Purifier
 */

import * as Logger from './_utils/Logger';
import * as Purifier from './_utils/Purifier';
import * as Library from './_utils/Library';
import isNewEnvironment from "./_utils/IsNewEnvironment";
import needToBeCompatible from "./_utils/NeedToBeCompatible";
import getResourceUrl from "./_utils/GetResourceUrl";
import isElementVisible from "./_utils/IsElementVisible";

import merge from './_utils/Function/Merge';
import shallowClone from './_utils/Function/ShallowClone';
const Function = {
   merge,
   shallowClone
};

import isPlainObject from "./_utils/Object/IsPlainObject";
import isEmpty from "./_utils/Object/IsEmpty";
const Object = {
   isPlainObject,
   isEmpty
};

import randomId from "./_utils/Number/RandomId";
const Number = {
   randomId
};

import flatten from "./_utils/Array/Flatten";
import findIndex from "./_utils/Array/FindIndex";
import uniq from "./_utils/Array/Uniq";
const Array = {
   flatten,
   findIndex,
   uniq
};

export {
   Logger,
   Purifier,
   Library,
   isNewEnvironment,
   needToBeCompatible,
   getResourceUrl,
   isElementVisible,
   Function,
   Object,
   Number,
   Array
};
