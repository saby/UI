/// <amd-module name="UI/_base/StateReceiver" />

import Serializer = require('Core/Serializer');
import { IoC } from 'Env/Env';
import {Common} from 'View/Executor/Utils';

type SerilizedType = {
   serialized: string,
   additionalDeps: any
};

function getDepsFromSerializer(slr) {
   let moduleInfo;
   let deps = {};
   let modules = slr._linksStorage;
   let parts;
   for (let key in modules) {
      if (modules.hasOwnProperty(key)) {
         moduleInfo = modules[key];
         if (moduleInfo.module) {
            parts = Serializer.parseDeclaration(moduleInfo.module);
            deps[parts.name] = true;
         }
      }
   }

   let addDeps = slr._depsStorage || {};
   for (let j in addDeps) {
      if (addDeps.hasOwnProperty(j)) {
         deps[j] = true;
      }
   }

   return deps;
}

class StateReceiver {
   private receivedStateObjectsArray: any = {};
   private deserialized: any = {};

   public serialize(): SerilizedType {
      let slr;
      let serializedMap = {};
      let allAdditionalDeps = {};
      let allRecStates = this.receivedStateObjectsArray;
      for (let key in allRecStates) {
         if (allRecStates.hasOwnProperty(key)) {
            var receivedState = allRecStates[key].getState();
            if (receivedState) {
               serializedMap[key] = receivedState;
            }
         }
      }

      slr = new Serializer();
      let serializedState = JSON.stringify(serializedMap, slr.serialize);
      Common.componentOptsReArray.forEach(function(re) {
         serializedState = serializedState.replace(re.toFind, re.toReplace);
      });
      serializedState = serializedState.replace(/\\"/g, '\\\\"');
      const addDeps = getDepsFromSerializer(slr);
      for (var dep in addDeps) {
         if (addDeps.hasOwnProperty(dep)) {
            allAdditionalDeps[dep] = true;
         }
      }

      return {
         serialized: serializedState,
         additionalDeps: allAdditionalDeps
      };
   }

   public deserialize(str: string) {
      let slr = new Serializer();
      try {
         this.deserialized = JSON.parse(str, slr.deserialize);
      } catch (e) {
         IoC.resolve('ILogger').error('Deserialize', 'Cant\'t deserialize ' + str);
      }
   }

   public register(key: string, inst: any) {
      if (this.deserialized[key]) {
         inst.setState(this.deserialized[key]);
         delete this.deserialized[key];
      }
      this.receivedStateObjectsArray[key] = inst;
   }

   public unregister(key: string) {
      delete this.receivedStateObjectsArray[key];
   }
}

export default StateReceiver;
