import {Control, IControlOptions, TemplateFunction} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/ReactDemo/TODO/Item');

export interface IItem extends IControlOptions {
   title: string;
   removeHandler: Function;
}

export default class Item extends Control<IItem> {
   protected _template: TemplateFunction = template;
   static _styles: string[] = ['UIDemo/ReactDemo/TODO/Item'];
   static displayName: string = 'MyTodoItem';
}
