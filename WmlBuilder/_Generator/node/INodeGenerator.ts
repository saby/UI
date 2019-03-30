import {IAstNode, Methods, IPreparedNode, IBuilder} from '../Interfaces';
import {IScope} from '../expression/IExpressionParser';

export declare class INodeGenerator {
   node: IAstNode;
   options:{[propertyname:string]:Array<IPreparedNode>};
   attributes:{[propertyname:string]:Array<IPreparedNode>};
   exportedOptions:Array<IPreparedNode>;
   exportedAttributes:Array<IPreparedNode>;
   constructor(node: IAstNode);

   getFunctionName: () => Methods;
   getChildren: () => Array<IAstNode>;
   getInjectedData:() => Array<IAstNode>;


   setPreparedChildren: (nodes:Array<IPreparedNode>) => void;
   setPreparedInjectedData: (nodes:Array<IPreparedNode>) => void;
   cookAttributes: () => void;

   getOption: (name:string) => Array<IPreparedNode>;
   saveOption: (name:string, value:Array<IPreparedNode>) => void;
   saveAttribute: (name:string, value:Array<IPreparedNode>) => void;

   collectExportedData: () => void;

   getAttributes: () => {[propertyname:string]:Array<IPreparedNode>};
   getOptions: () => {[propertyname:string]:Array<IPreparedNode>};
   
   getResult: () => IPreparedNode;
}
