/// <amd-module name="UI/_base/StateReceiver" />
import { IStateReceiver } from 'Application/Interface';
import Serializer = require('Core/Serializer');
import { Common } from 'View/Executor/Utils';

//@ts-ignore
import { Logger } from 'UI/Utils';

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
      const serializedMap = {};
      const allAdditionalDeps = {};
      const allRecStates = this.receivedStateObjectsArray;
      Object.keys(allRecStates).forEach((key) => {
         const state = allRecStates[key].getState();
         const receivedState = typeof state === 'object' && 'receivedState' in state ? state.receivedState : state;
         if (!receivedState) { return; }
         try {
            serializedMap[key] = JSON.stringify(receivedState, slr.serializeStrict);
         } catch (e) {
            // FIXME: ОЧЕНЬ ОЧЕНЬ МНОГО ОШИБОК В ЛОГИ ОБЛАКА! Отключаю для 5ххх
            //Logger.error(`${state?.moduleName || key} _beforeMount вернул несериализуемое состояние: ${e}` );
            delete serializedMap[key];
         }
      });
      /**
       * Здесь дополнительная сериализация: сериализуется словарь уже сериализованных receivedStates
       * Отдельная сериализация каждого receivedState позволяет его валидировать
       * Десериализвация также двухэтапная
       */
      let serializedState = JSON.stringify(serializedMap);
      Common.componentOptsReArray.forEach(
         (re): void => {
            serializedState = serializedState.replace(re.toFind, re.toReplace);
         }
      );
      serializedState = serializedState.replace(/\\"/g, '\\\\"');
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
      Object.entries(JSON.parse(str))
         .forEach(([key, value]: [string, string]) => {
            try {
               this.deserialized[key] = JSON.parse(value, slr.deserialize);
            } catch (error) {
               Logger.error(`Ошибка десериализации ${key} - ${value}`, null, error);
            }
         });
   }

   register(key: string, inst: any): void {
      if (this.deserialized[key]) {
         inst.setState(this.deserialized[key]);
         delete this.deserialized[key];
      }
      // todo проверка на сервис представления
      if (typeof process !== 'undefined' && !process.versions) {
         if (typeof this.receivedStateObjectsArray[key] !== 'undefined') {
            const message = '[UI/_base/StateReceiver:register] - Try to register instance more than once ' +
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
