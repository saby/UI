import {IAstNode, IPreparedNode, TypeFunction} from '../../Interfaces';
import {isWasabyTag, isAttr} from '../../tag/name';
import {Parser} from "../../expression/Parser";
import { Node } from '../Node';


export class Control extends Node {

    expressionsParser:Parser = new Parser();

    constructor(node:IAstNode) {
        super(node);
        this.saveOption('__specialOptionForControl', [{
            name: node.name,
            type: TypeFunction.import
        }]);
    }

    getChildren() {
        return [];
    }

    getInjectedData() {
        return this.node.injectedData || [];
    }

    setPreparedChildren(nodes:Array<IPreparedNode>): void {
        //do nothing
    }

    setPreparedInjectedData(nodes:Array<IPreparedNode>): void {
        nodes.forEach((node)=>{
            let option = node.name;
            if (isWasabyTag(option)) {
                let optionName = option.replace('ws:', '');
                this.saveOption(optionName, [node]);
            } else {
                let content:Array<IPreparedNode> = this.getOption('conent');
                if (!content) {
                    content = [];
                }
                content.push(node);
                this.saveOption('content', content);
            }
        })
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
                    this.saveOption(i, value);
                }
            }
        }
    }
}
