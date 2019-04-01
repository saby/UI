import { IStructureCreator } from "./IStructureCreator";

export interface IGenerator {
    getMemoData: (rootKey: string, callback:()=>any, deps:Array<any>) => any;
    createText: (text:string, key:string) => any;
    createTag: (tag:string|Function, options: any, attributes: any, key: string, control: any) => any;
    createControl: (tag:string, options: any, attributes: any, key: string, depsLocal:any, logicParent: any) => any;
    joinElements: () => any;
    setImplementation: (struct:IStructureCreator) => void;
    
}