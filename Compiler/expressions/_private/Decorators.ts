/**
 * @description Decorators used by pipe notation in template expressions. For example: value|trim|toUpperCase
 * @author Крылов М.А.
 * @file Compiler/expressions/_private/Decorators.ts
 */

import { createErrorHandler } from 'Compiler/utils/ErrorHandler';
import * as FSC from 'Compiler/modules/data/utils/functionStringCreator';

const DIR_FROM_CONTEXT = 'fromContext';
const SEPARATOR = '/';
const errorHandler = createErrorHandler(true);

function splitControlPropName(name: any, separator: any, fieldName: any): any {
   let resultArr;
   try {
      resultArr = name.split(separator);
   } catch (error) {
      errorHandler.error(
         'There\'s no control property name to use. You should use binding decorator ' +
         'only in control config. Context field name: ' + fieldName,
         {
            fileName: this.fileName
         }
      );
      throw new Error('В качестве имени опции контрола был передан undefined');
   }
   return resultArr;
}

class BindingObject {
   fieldName: any;
   propName: any;
   propPath: any;
   fullPropName: any;
   propPathStr: any;
   oneWay: any;
   direction: any;
   nonExistentValue: any;
   bindNonExistent: any;

   constructor(
      controlPropName: any,
      contextFieldName: any,
      way: any,
      direction: any,
      bindNonExistent: any
   ) {
      const propArr = splitControlPropName(controlPropName, SEPARATOR, contextFieldName);
      const propPath = propArr.slice(1);
      const propPathStr = propPath.join(SEPARATOR);
      let currentDirection = direction;
      if (currentDirection) {
         currentDirection = FSC.wrapAroundExec('"" +' + currentDirection + '+ ""');
      }

      this.fieldName = FSC.wrapAroundExec('"" +' + (contextFieldName || '""') + '+ ""');
      this.propName = controlPropName;
      this.propPath = propPath;
      this.fullPropName = controlPropName;
      this.propPathStr = propPathStr;
      this.oneWay = way;
      this.direction = currentDirection || DIR_FROM_CONTEXT;
      this.nonExistentValue = undefined;
      this.bindNonExistent = bindNonExistent;
   }
}

class BindNode {
   value: any;
   binding: BindingObject;

   constructor(value: any, controlPropName: any, initValue: any, direction: any, way: any) {
      this.value = initValue;
      const bindNonExistent = initValue !== undefined;
      this.binding = new BindingObject(controlPropName, value, way, direction, bindNonExistent);
   }
}

export function bind(value: any, controlPropName: any, initValue: any, direction: any): any {
   return new BindNode(value, controlPropName, initValue, direction, true);
}

export function mutable(value: any, controlPropName: any, initValue: any): any {
   return new BindNode(value, controlPropName, initValue, undefined, false);
}
