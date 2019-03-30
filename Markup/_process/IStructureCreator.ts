export interface IStructureCreator {
    createText: (text:string, key:string) => any;
    createTag: (tag:string, children: any, attributes: any, key: string, control?: any) => any;
    createControl: (tag:any, options: any, attributes: any, key: string, logicParent: any, gen: any) => any;
    joinElements: (elements:Array<any>) => Array<any>;
}