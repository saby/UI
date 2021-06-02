import * as ReactDOMServer from 'react-dom/server';
import { Control } from 'UICore/Base';
import { IControlOptions } from 'UICommon/Base';
import { IControlConfig } from './interfaces';
import {
   CommonUtils as Common,
   IAttributes,
   VoidTags as voidElements,
   TAttributes,
   IGenerator
} from 'UICommon/Executor';
import { Attr } from 'UICommon/Executor';
import { IWasabyEvent } from 'UICommon/_events/IEvents';
import { Generator } from '../Generator';
import React from "react";
import {TemplateOrigin} from '../Vdom/interfaces';

/**
 * @author Тэн В.А.
 */
export class GeneratorText extends Generator implements IGenerator {
   /**
    * подготавливает опции для контрола. вызывается в функции шаблона в случае выполнения инлайн шаблона
    * @param tplOrigin тип шаблона
    * @param scope результирующий контекст выполнения
    */
   prepareDataForCreate(tplOrigin: TemplateOrigin, scope: IControlOptions): IControlOptions {
      return scope;
   }

   protected calculateOptions(
       resolvedOptionsExtended: IControlOptions,
       config: IControlConfig,
       events: Record<string, IWasabyEvent[]>,
       name: string): IControlOptions {
      return {
         ...resolvedOptionsExtended,
         ...{events}
      };
   }

   createText(text) {
      return text;
   }

   /**
    * Дает возможность дополнительно трансформировать результат построения контрола.
    * @param control Результат построения контрола.
    */
   processControl(
       control: React.ComponentElement<
           IControlOptions,
           Control<IControlOptions, object>
           >
   ): string {
      return ReactDOMServer.renderToString(control);
   }

   joinElements(elements: string[]): string {
      if (Array.isArray(elements)) {
         let res = '';
         const self = this;
         elements.forEach(function joinOneElement(element) {
            if (Array.isArray(element)) {
               element = self.joinElements(element);
            }
            res += (element || '');
         });

         return res;
      } else {
         throw new Error('joinElements: elements is not array');
      }
   }

   createTag(tag, attrs, children, attrToDecorate?, defCollection?): string {
      if (!attrToDecorate) {
         attrToDecorate = {};
      }
      if (!attrs) {
         attrs = {attributes: {}};
      }

      let mergedAttrs = Attr.processMergeAttributes(
          attrToDecorate.attributes as IAttributes,
          attrs.attributes as IAttributes
      );

      Object.keys(mergedAttrs).forEach((attrName) => {
         if (attrName.indexOf('top:') === 0) {
            const newAttrName = attrName.replace('top:', '');
            mergedAttrs[newAttrName] = mergedAttrs[newAttrName] || mergedAttrs[attrName];
            delete mergedAttrs[attrName];
         }
      });

      const mergedAttrsStr = mergedAttrs
          ? decorateAttrs(mergedAttrs, {})
          : '';
      // tslint:disable-next-line:no-bitwise
      if (~voidElements.indexOf(tag)) {
         return '<' + tag + mergedAttrsStr + ' />';
      }
      return '<' + tag + mergedAttrsStr + '>' + this.joinElements(children) + '</' + tag + '>';
   }

   createDirective(text: string): string {
      return '<' + text + '>';
   }

   escape<T>(value: T): T {
      return Common.escape(value);
   }
}

function decorateAttrs(attr1: TAttributes, attr2: TAttributes): string {
   function wrapUndef(value: string): string {
      if (value === undefined || value === null) {
         return '';
      } else {
         return value;
      }
   }

   const attrToStr = (attrs: Array<string>): string => {
      let str = '';
      for (const attr in attrs) {
         if (attrs.hasOwnProperty(attr)) {
            str += (wrapUndef(attrs[attr]) !== '' ? ' ' + (attr + '="' + attrs[attr] + '"') : '');
         }
      }
      return str;
   };
   return attrToStr(Attr.joinAttrs(attr1, attr2));
}
