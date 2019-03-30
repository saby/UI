import {IAstNode, IPreparedNode, ITypeAstNode, Methods, TypeFunction, IBuilder} from '../Interfaces';
import {INodeGenerator} from './INodeGenerator';
import { isWasabyTag } from '../tag/name';

const IGNORED_ATTR:Array<string> = ['_wstemplatename'];

export class Node implements INodeGenerator {
    
    options:{[propertyname:string]:Array<IPreparedNode>} = {};
    attributes:{[propertyname:string]:Array<IPreparedNode>} = {};
    exportedOptions:Array<IPreparedNode> = [];
    exportedAttributes:Array<IPreparedNode> = [];

    private isDataExported(data:IPreparedNode, nameFilter: string):boolean {
        if (data.arguments && data.arguments.options) {
            return data.arguments.options[0] !== nameFilter;
        }
        if (data.type == TypeFunction.import) {
            return true;
        }
        return false;
    }

    private getCalculatedVars(oneProp: Array<IPreparedNode>, nameFilter: string):Array<IPreparedNode> {
        return oneProp.reduce((prev:Array<IPreparedNode>, prop:IPreparedNode) => {
            if (prop.type === TypeFunction.child || prop.type === TypeFunction.value) {
                let exportedChild = prop.exportedOptions ? prev.concat(prop.exportedOptions.filter((element)=>{return this.isDataExported(element, nameFilter);})) : prev;
                let exportedChildAttr = prop.exportedAttributes ? exportedChild.concat(prop.exportedAttributes.filter((element)=>{return this.isDataExported(element, nameFilter);})) : exportedChild;
                return exportedChildAttr;
            }
            if (prop.type === TypeFunction.call) {
                return prev.concat(this.getCalculatedVars(prop.arguments.options, nameFilter));
            }
            if (prop.type === TypeFunction.import) {
                prev.push(prop);
            }
            if (prop.type === TypeFunction.data) {
                if (prop.arguments.options[0] !== nameFilter)
                    prev.push(prop);
            }
            return prev;
        }, []);
    }

    node: IAstNode;
    constructor(node: IAstNode) {
        this.node = node;
    }

    getOption(name:string) {
        return this.options[name];
    }

    saveOption(name:string, value:Array<IPreparedNode>) {
        if (IGNORED_ATTR.indexOf(name) === -1)
            this.options[name] = value;
    }

    saveAttribute(name:string, value:Array<IPreparedNode>) {
        if (IGNORED_ATTR.indexOf(name) === -1)
            this.attributes[name] = value;
    }


    getFunctionName():Methods {
        throw new Error('Method is not implemented');
    }
    getChildren():Array<IAstNode> {
        throw new Error('Method is not implemented');
    }
    getInjectedData():Array<IAstNode> {
        throw new Error('Method is not implemented');
    }

    setPreparedChildren(nodes:Array<IPreparedNode>) {
        throw new Error('Method is not implemented');
    }
    setPreparedInjectedData(nodes:Array<IPreparedNode>) {
        throw new Error('Method is not implemented');
    }
    cookAttributes() {
        throw new Error('Method is not implemented');
    }
    getResult():IPreparedNode {
        throw new Error('Method is not implemented');
    }

    getAttributes():{[propertyname:string]:Array<IPreparedNode>} {
        return this.attributes;
    }
    getOptions():{[propertyname:string]:Array<IPreparedNode>} {
        return this.options;
    }


    collectExportedData() {
        let attrs = this.getAttributes();
        let opts = this.getOptions();

        for(let i in attrs) {
            if (attrs.hasOwnProperty(i)) {
                this.exportedAttributes = this.exportedAttributes.concat(this.getCalculatedVars(attrs[i], ''));
            }
        }
        for(let i in opts) {
            if (opts.hasOwnProperty(i)) {
                //TODO: bad code here! the result depends from this.node.name
                //but it's actually only for ControlNode
                this.exportedOptions = this.exportedOptions.concat(this.getCalculatedVars(opts[i], this.node.name && isWasabyTag(this.node.name) ? i : ''));
            }
        }
    }
}
