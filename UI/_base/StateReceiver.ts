/// <amd-module name="UI/_base/StateReceiver" />

import Serializer = require('Core/Serializer');
import { IoC } from 'Env/Env';
import { Common } from 'View/Executor/Utils';

interface ISerializedType {
    serialized: string;
    additionalDeps: any;
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

class StateReceiver {
    private receivedStateObjectsArray: any = {};
    private deserialized: any = {};

    serialize(): ISerializedType {
        let slr;
        const serializedMap = {};
        const allAdditionalDeps = {};
        const allRecStates = this.receivedStateObjectsArray;
        for (const key in allRecStates) {
            if (allRecStates.hasOwnProperty(key)) {
                const receivedState = allRecStates[key].getState();
                if (receivedState) {
                    serializedMap[key] = receivedState;
                }
            }
        }

        slr = new Serializer();
        let serializedState = JSON.stringify(serializedMap, slr.serialize);
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

    deserialize(str: string): void {
        const slr = new Serializer();
        try {
            this.deserialized = JSON.parse(str, slr.deserialize);
        } catch (e) {
            IoC.resolve('ILogger').error('Deserialize', "Cant't deserialize " + str);
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
              IoC.resolve('ILogger').warn('StateReceiver::register', 'Try to register instance more than once ' +
                 'or duplication of keys happened; current key is "' + key + '"');
           }
        }
        this.receivedStateObjectsArray[key] = inst;
    }

    unregister(key: string): void {
        delete this.receivedStateObjectsArray[key];
    }
}

export default StateReceiver;
