import {IAstNode, IPreparedNode, ITypeAstNode} from '../../Interfaces';
import {isAttr} from '../../tag/name';
import {Parser} from "../../expression/Parser";
import {Node} from '../Node';

export class Dom extends Node {

    expressionsParser:Parser = new Parser();

    getChildren():Array<IAstNode> {
        return this.node.children.filter((el)=>{ return el.type !== ITypeAstNode.module; });
    }

    getInjectedData():Array<IAstNode> {
        return [];
    }

    setPreparedChildren(nodes:Array<IPreparedNode>): void {
        if (nodes.length > 0) {
            this.saveOption('content', nodes);
        }
    }

    setPreparedInjectedData(): void {
        //do nothing
    }

    cookAttributes():void {
        for (let i in this.node.attribs) {
            if (this.node.attribs.hasOwnProperty(i)
                && typeof this.node.attribs[i] === 'object') {
                //we have odd attribute '_wstemplatename'
                let value = this.expressionsParser.parseExpression(this.node.attribs[i].data);
                if (isAttr(i)) {
                    this.saveAttribute(i.split(':')[1], value);
                } else {
                    this.saveAttribute(i, value);
                }
            }
        }
    }

}
