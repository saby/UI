/// <amd-module name="UI/_state/StateReceiver" />
import { IStateReceiver } from 'Application/Interface';
import Serializer = require('UI/_state/Serializer');
import { Logger } from 'UI/Utils';

/**
 * @author Санников К.
 */

interface ISerializedType {
   serialized: string;
   additionalDeps: { [depPath: string]: boolean; };
}

function getDepsFromSerializer(slr: any): any {
   let moduleInfo;
   const deps = {};
   const modules = slr._linksStorage;
   let parts;
   for (const key in modules) {
      if (modules.hasOwnProperty(key)) {
         moduleInfo = modules[key];
         if (moduleInfo.module) {
            parts = Serializer.parseDeclaration(moduleInfo.module);
            deps[parts.name] = true;
         }
      }
   }

   const addDeps = slr._depsStorage || {};
   for (const j in addDeps) {
      if (addDeps.hasOwnProperty(j)) {
         deps[j] = true;
      }
   }

   return deps;
}

class StateReceiver implements IStateReceiver {
   private receivedStateObjectsArray: any = {};
   private deserialized: any = {};

   serialize(): ISerializedType {
      const slr = new Serializer();
      /**
       * Сериалайзер в своей памяти учитывает предыдущие результаты и может выдать ссылку на объект,
       * если его 2 раза прогнать через один инстанс. Поэтому для проверки один сериалайзер, а для итога другой.
       */
      const slrForCheck = new Serializer();
      const serializedMap = {};
      const allAdditionalDeps = {};
      const allRecStates = this.receivedStateObjectsArray;
      Object.keys(allRecStates).forEach((key) => {
         const state = allRecStates[key].getState();
         const receivedState = typeof state === 'object' && 'receivedState' in state ? state.receivedState : state;
         if (!receivedState) { return; }
         try {
            /**
             * Если удалось сериализовать отдельное состояние, то можно его добавить в общий несериализованный словарь
             * Раньше в этот словарь добавлялось уже сериализованное значение. И потом словарь еще раз сериализовывался.
             * Результат: экранирование тремя слешами
             * https://online.sbis.ru/opendoc.html?guid=3b1fffe6-6f75-411f-989d-f0f90ec2ec46
             */
            if (JSON.stringify(receivedState, slrForCheck.serializeStrict)) {
               serializedMap[key] = receivedState;
            }
         } catch (e) {
            let serializedFieldError = '';
            if (typeof(serializedMap[key]) === 'object') {
               serializedFieldError = `${key}: ${typeof(serializedMap[key])}`;
            } else {
               serializedFieldError = `${key}: ${serializedMap[key]}`;
            }
            Logger.error(`${state?.moduleName || key}, ${serializedFieldError} _beforeMount вернул несериализуемое состояние : ${e}` );
            delete serializedMap[key];
         }
      });
      let serializedState = JSON.stringify(serializedMap, slr.serializeStrict);
      Serializer.componentOptsReArray.forEach(
         (re): void => {
            serializedState = serializedState.replace(re.toFind, re.toReplace);
         }
      );
      const addDeps = getDepsFromSerializer(slr);
      for (const dep in addDeps) {
         if (addDeps.hasOwnProperty(dep)) {
            allAdditionalDeps[dep] = true;
         }
      }

      return {
         serialized: serializedState,
         additionalDeps: allAdditionalDeps
      };
   }

   deserialize(str: string | undefined): void {
      if (!str) { return; }
      const slr = new Serializer();
      try {
         this.deserialized = JSON.parse(str, slr.deserialize);
      } catch (error) {
         Logger.error(`Ошибка десериализации ${str}`, null, error);
      }
   }

   register(key: string, inst: any): void {
      if (this.deserialized[key]) {
         inst.setState(this.deserialized[key]);
         delete this.deserialized[key];
      }
      // todo проверка на сервис представления
      if (typeof process !== 'undefined' && !process.versions) {
         if (typeof this.receivedStateObjectsArray[key] !== 'undefined') {
            const message = '[UI/_state/StateReceiver:register] - Try to register instance more than once ' +
                            `or duplication of keys happened; current key is ${key}`;
            Logger.warn(message, inst);
         }
      }
      this.receivedStateObjectsArray[key] = inst;
   }

   unregister(key: string): void {
      delete this.receivedStateObjectsArray[key];
   }
}

export default StateReceiver;
