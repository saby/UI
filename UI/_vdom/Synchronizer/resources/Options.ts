/// <amd-module name="UI/_vdom/Synchronizer/resources/Options" />

import { Set } from 'Types/shim';

// FIXME: Необходимо использовать интерфейс из Types
export interface IVersionable {
   getVersion(): number;
}

export interface IVersionableArray {
   getArrayVersion?(): number;
   _arrayVersion?: number;
}

export interface IVersions {
   [property: string]: IVersions | number;
}

// TODO: Необходимо реализовать флаг, по которому будем определять этот интерфейс
//  Правка в кодогенерацию!
export interface ITemplate extends Object {
   func: Function;
   internal: object;
}

// TODO: Необходимо реализовать флаг, по которому будем определять этот интерфейс
//  Правка в кодогенерацию!
export interface ITemplateArray extends Array<ITemplate> {
   isDataArray: boolean;
}

// TODO: Необходимо реализовать флаг, по которому будем определять этот интерфейс
//  Правка в кодогенерацию!
export interface ITemplateObject extends ITemplate {
   isDataArray: boolean;
}

const EMPTY_STRING = '';
const EMPTY_OBJECT = { };
const DIRTY_CHECKING_PREFIX = '__dirtyCheckingVars_';
const IGNORE_CHANGING_FLAG = '_ignoreChanging';
const DEEP_CHECKING_FLAG = '_isDeepChecking';
// FIXME: Контролы. Костыль. Исправить.
const PREFER_VERSIONS_API_FLAG = '_preferVersionAPI';

export declare type TOptionValue =
   IVersionable | IVersionableArray | ITemplateArray | ITemplateObject | Date |
   object | symbol | number | string | boolean | null | undefined;

export interface IManualObject extends Object {
   [property: string]: IManualObject | TOptionValue;
   [IGNORE_CHANGING_FLAG]?: boolean;
   [DEEP_CHECKING_FLAG]?: boolean;
}

export interface IOptions extends Object {
   [property: string]: IManualObject | TOptionValue;
}

function areBothNaN(a: number, b: number): boolean {
   return typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b);
}

function isDirtyChecking(property: string): boolean {
   return typeof property === 'string' && property.startsWith(DIRTY_CHECKING_PREFIX);
}

function shouldIgnoreChanging(obj: IManualObject): boolean {
   return !!(obj && obj[IGNORE_CHANGING_FLAG]);
}

function shouldCheckDeep(obj: IManualObject): boolean {
   return !!(obj && obj[DEEP_CHECKING_FLAG]);
}

function isVersionable(obj: IVersionable): boolean {
   return !!(obj && typeof obj === 'object' && typeof obj.getVersion === 'function');
}

function isVersionableArray(obj: IVersionableArray): boolean {
   return !!(obj && Array.isArray(obj) && typeof obj.getArrayVersion === 'function');
}

function isTemplate(tmpl: ITemplate): boolean {
   return !!(tmpl && typeof tmpl.func === 'function' && tmpl.hasOwnProperty('internal'));
}

function isTemplateArray(templateArray: ITemplateArray): boolean {
   return Array.isArray(templateArray) &&
      templateArray.every((tmpl) => isTemplate(tmpl)) &&
      templateArray.isDataArray;
}

function isTemplateObject(tmpl: ITemplateObject): boolean {
   return isTemplate(tmpl) && tmpl.isDataArray;
}

function getTemplateInternal(tmpl: ITemplate): IOptions {
   return (tmpl && tmpl.internal || EMPTY_OBJECT) as IOptions;
}

export function collectObjectVersions(collection: IOptions): IVersions {
   const versions = { };
   for (const key in collection) {
      if (collection.hasOwnProperty(key)) {
         const value = collection[key];
         if (isVersionable(value as IVersionable)) {
            versions[key] = (value as IVersionable).getVersion();
         } else if (isTemplateArray(value as ITemplateArray)) {
            const templateArray: ITemplateArray = value as ITemplateArray;
            for (let idx = 0; idx < templateArray.length; ++idx) {
               const innerVersions = collectObjectVersions(getTemplateInternal(templateArray[idx]));
               for (const innerKey in innerVersions) {
                  if (innerVersions.hasOwnProperty(innerKey)) {
                     versions[key + ';' + idx + ';' + innerKey] = innerVersions[innerKey];
                  }
               }
            }
         } else if (isVersionableArray(value as IVersionableArray)) {
            versions[key] = (value as IVersionableArray).getArrayVersion();
         } else if (isTemplateObject(value as ITemplateObject)) {
            const templateObject: ITemplateObject = value as ITemplateObject;
            const innerVersions = collectObjectVersions(getTemplateInternal(templateObject));
            for (const innerKey in innerVersions) {
               if (innerVersions.hasOwnProperty(innerKey)) {
                  versions[key + ';;' + innerKey] = innerVersions[innerKey];
               }
            }
         }
      }
   }
   return versions;
}

// TODO: Необходимо реализовать флаг, по которому будем определять scope-объекты.
//  Правка в кодогенерацию!
function isPossiblyScopeObject(
   property: string,
   nextValue: IOptions,
   prevValue: IOptions
): boolean {
   return isDirtyChecking(property) &&
      typeof prevValue === 'object' &&
      typeof nextValue === 'object' &&
      nextValue && prevValue &&
      // We don't need to check Date object internal properties
      !(nextValue instanceof Date) &&
      !isVersionable((nextValue as unknown) as IVersionable);
}

function isTemplateArrayChanged(
   next: ITemplateArray,
   prev: ITemplateArray,
   versionsStorage: object = EMPTY_OBJECT,
   checkPrevValue: boolean = false,
   prefix: string = EMPTY_STRING,
   isCompound: boolean = false
): boolean {
   if (next.length !== prev.length) {
      return true;
   }
   for (let kfn = 0; kfn < next.length; kfn++) {
      const localPrefix = prefix + ';' + kfn + ';';
      const ch = getChangedOptions(
         getTemplateInternal(next[kfn]),
         getTemplateInternal(prev[kfn]),
         false,
         versionsStorage,
         checkPrevValue,
         localPrefix,
         isCompound
      );
      if (ch) {
         return true;
      }
   }
   return false;
}

function isTemplateObjectChanged(
   next: ITemplateObject,
   prev: ITemplateObject,
   versionsStorage: object = EMPTY_OBJECT,
   checkPrevValue: boolean = false,
   prefix: string = EMPTY_STRING,
   isCompound: boolean = false
): boolean {
   const localPrefix = prefix + ';' + ';';
   const ch = getChangedOptions(
      getTemplateInternal(next),
      getTemplateInternal(prev),
      false,
      versionsStorage,
      checkPrevValue,
      localPrefix,
      isCompound
   );
   return !!ch;
}

function getKeys(first: object, second: object): string[] {
   const keys = new Set();
   const firstKeys = Object.keys(first);
   for (let j = 0; j < firstKeys.length; ++j) {
      keys.add(firstKeys[j]);
   }
   const secondKeys = Object.keys(second);
   for (let j = 0; j < secondKeys.length; ++j) {
      keys.add(secondKeys[j]);
   }
   const properties = [];
   keys.forEach((key: string): void => {
      properties.push(key);
   });
   return properties;
}

export function getChangedOptions(
   next: IOptions = EMPTY_OBJECT,
   prev: IOptions = EMPTY_OBJECT,
   ignoreDirtyChecking: boolean = false,
   versionsStorage: object = EMPTY_OBJECT,
   checkPrevValue: boolean = false,
   prefix: string = EMPTY_STRING,
   isCompound: boolean = false
): IOptions | null {
   // TODO: ignoreDirtyChecking, checkPrevValue, isCompound вынести в битовый флаг
   // TODO: отказаться от префиксов в пользу древовидной структуры хранилища версий (сейчас словарь по сути)
   const properties = getKeys(next, prev);
   const changes = { };
   let hasChanges = false;
   let hasPrev;
   let hasNext;

   for (let i = 0; i < properties.length; ++i) {
      const property = properties[i];

      /**
       * todo игнорируем _logicParent, эта опция вообще не должна сюда прилетать и сравниваться на изменения
       */
      if (property === '_logicParent') {
         continue;
      }

      /**
       * Игнорируем переменные dirtyChecking для compoundControl
       * Эти переменные могут появиться только когда внутри VDom контрола
       * есть CompoundControl внутри которого в контентных опциях
       * есть контролы
       */
      if (ignoreDirtyChecking && isDirtyChecking(property)) {
         continue;
      }
      // TODO: Сделать проверку изменения для контекстов
      //  https://online.sbis.ru/opendoc.html?guid=bb9a707f-b8fe-4b26-b2b3-874e060548c8
      hasPrev = prev.hasOwnProperty(property) || (checkPrevValue && prev[property] !== undefined);
      hasNext = next.hasOwnProperty(property) || next[property] !== undefined;

      if (hasPrev && hasNext /** Update */) {
         if (areBothNaN(prev[property] as number, next[property] as number)) {
            continue;
         }
         /**
          * All objects in control's options are compared only by reference
          * (and version if it is supported). CompoundControl monitors
          * changes inside objects and/or arrays by itself
          */
         if (next[property] === prev[property]) {
            if (isVersionable(next[property] as IVersionable) && versionsStorage) {
               const newVersion = (next[property] as IVersionable).getVersion();
               if (versionsStorage[prefix + property] !== newVersion) {
                  hasChanges = true;
                  changes[property] = next[property];
               }
            }
            if (isVersionableArray(next[property] as IVersionableArray) && versionsStorage) {
               const newVersion = (next[property] as IVersionableArray).getArrayVersion();
               if (versionsStorage[prefix + property] !== undefined &&
                   versionsStorage[prefix + property] !== newVersion) {
                  hasChanges = true;
                  changes[property] = next[property];
               }
            }
         } else {
            if (shouldIgnoreChanging(next[property] as IManualObject)) {
               continue;
            }
            if (Array.isArray(next[property]) && next[property]) {
               if (!isTemplateArray(next[property] as ITemplateArray)) {
                  hasChanges = true;
                  changes[property] = next[property];
               } else {
                  if (!prev[property]) {
                     hasChanges = true;
                     changes[property] = next[property];
                     continue;
                  }
                  if (isTemplateArrayChanged(
                     next[property] as ITemplateArray,
                     prev[property] as ITemplateArray,
                     versionsStorage,
                     checkPrevValue,
                     prefix + property,
                     isCompound
                  )) {
                     hasChanges = true;
                     changes[property] = next[property];
                  }
               }
            } else if (isTemplateObject(next[property] as ITemplateObject)) {
               // Inner template with internal options. We only need to check internal options
               // cause function is bound and it can lead to useless redraws.
               if (isTemplateObjectChanged(
                  next[property] as ITemplateObject,
                  prev[property] as ITemplateObject,
                  versionsStorage,
                  checkPrevValue,
                  prefix + property,
                  isCompound
               )) {
                  hasChanges = true;
                  changes[property] = next[property];
               }
            } else if (isVersionable(next[property] as IVersionable) && next[property][PREFER_VERSIONS_API_FLAG]) {
               /*
                * Есть такой кейс, когда объекты всегда новые, но они равны
                * поставим флажок в объект, который заставит нас смотреть только на версию
                * FIXME: исправить костыль
                */
               const newVersion = (next[property] as IVersionable).getVersion();
               if (versionsStorage[prefix + property] !== newVersion) {
                  hasChanges = true;
                  changes[property] = next[property];
               }
            } else if (isPossiblyScopeObject(property, next[property] as IOptions, prev[property] as IOptions)) {
               // Object inside __dirtyChecking must be checked, it can be "scope=object" in subcontrol
               const innerCh = getChangedOptions(
                  next[property] as IOptions,
                  prev[property] as IOptions,
                  false,
                  EMPTY_OBJECT,
                  true,
                  EMPTY_STRING,
                  isCompound
               );
               if (innerCh) {
                  hasChanges = true;
                  changes[property] = next[property];
               }
            } else if (
               shouldCheckDeep(next[property] as IManualObject) &&
               shouldCheckDeep(prev[property] as IManualObject)
            ) {
               const innerCh = getChangedOptions(
                  next[property] as IOptions,
                  prev[property] as IOptions,
                  true,
                  EMPTY_OBJECT,
                  true,
                  EMPTY_STRING,
                  isCompound
               );
               if (innerCh) {
                  hasChanges = true;
                  changes[property] = next[property];
               }
            } else {
               hasChanges = true;
               changes[property] = next[property];
            }
         }
      } else if (!hasPrev && hasNext /** Insertion */) {
         // Для compound control мы не должны отслеживать добавление/удаление опций, потому что
         // для измененных свойств происходит установка новых значений с помощью методов set{$propName}
         // или _setOption, и это свойство должно существовать.
         if (next.hasOwnProperty(property) && !prev.hasOwnProperty(property) && !isCompound) {
            hasChanges = true;
            changes[property] = next[property];
         }
         // Такая же проверка должна быть на удаление старой опции. Но в таком случае ломаются юниты,
         // которые проверяют лишние перерисовки. Потому что в опциях иногда появляются служебные поля,
         // которые не надо добавлять в changedOptions.
         // Кейс описан в тесте "old option removed"
         // FIXME: раскомментить тест old option removed и поправить поведенине getChangedOptions
      } else if (hasPrev && !hasNext /** Removal */) {
         if (checkPrevValue) {
            if (shouldIgnoreChanging(next[property] as IManualObject)) {
               continue;
            }
            hasChanges = true;
            changes[property] = next[property];
         }
      }
   }
   return hasChanges ? changes : null;
}
