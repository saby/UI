import { IGenerator } from "./IGenerator";
import { IStructureCreator } from "./IStructureCreator";
import { partial } from "./serviceTag/partial";

let STORE = {};

const SYSTEM_CONTROLS = {
    partial
};

export class Generator implements IGenerator{
    private structure: IStructureCreator;
    setImplementation(struct:IStructureCreator) {
        this.structure = struct;
    }

    getMemoData(rootKey: string, callback:()=>any, deps:Array<any>) {
        let data = STORE[rootKey];
        if (!data) {
            STORE[rootKey] = {
                data: callback(),
                deps: deps
            };
            return STORE[rootKey].data;
        }
        for (let i=0;i<deps.length;i++) {
            if (data.deps[i] !== deps[i]) {
                STORE[rootKey] = {
                    data: callback(),
                    deps: deps
                };
                return STORE[rootKey].data;
            }
        }

        return STORE[rootKey].data;
    }

    createText(text:string, key:string) {
        return this.structure.createText(text, key);
    }

    createTag(tag:string|Function, options: any, attributes: any, key: string, control: any) {
        //TODO:: where is hooks?
        if (typeof tag === 'string') {
            return this.structure.createTag(tag, options, attributes, key, control);
        } else {
            return this.structure.createControl(tag, Array.isArray(options) ? {content: options} : options, attributes, key, control, this);
        }
    }


    joinElements(...args) {
        return this.structure.joinElements([].slice.call(arguments));
    }
}