import * as ReactDOMServer from 'react-dom/server';
import * as React from 'react';
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



/**
 * @author Тэн В.А.
 */
export class GeneratorText extends Generator implements IGenerator {
   protected calculateOptions(
       resolvedOptionsExtended: IControlOptions,
       config: IControlConfig,
       events: Record<string, IWasabyEvent[]>,
       name: string): IControlOptions {
      return {
         ...resolvedOptionsExtended,
         ...{events}
      }
   }

   createText(text) {
      return text;
   };

   createWsControl(
       origin: string | typeof Control,
       scope: IControlOptions,
       _: unknown,
       __: unknown,
       deps: any
   ): string {
      if (origin.name ===  "StartApplicationScript") {
         const start = `<div><script>document.addEventListener('DOMContentLoaded', function() { let steps = [ { deps: ['Env/Env', 'Application/Initializer', 'Application/Env', 'SbisEnvUI/Wasaby', 'UI/Base', 'UI/State', 'Application/State', 'Core/polyfill'], callback: function (Env, AppInit, AppEnv, EnvUIWasaby, UIBase, UIState, AppState) { window.startContextData = {AppData: new UIState.AppData({})}; Object.assign(Env.constants, window.wsConfig); require( ["UIDemo/Index"], function () { var sr = new AppState.StateReceiver(UIState.Serializer); AppInit.default(window.wsConfig, void 0, sr); UIBase.BootstrapStart({}, document.getElementById('wasaby-content')); }); if (Env.constants.isProduction) { console.log( '%c\tЭта функция браузера предназначена для разработчиков. tЕсли кто-то сказал вам скопировать и вставить что-то здесь, это мошенники.\t\tВыполнив эти действия, вы предоставите им доступ к своему аккаунту.\t', 'background: red; color: white; font-size: 22px; font-weight: bolder; text-shadow: 1px 1px 2px black;' ); } } } ]; if (false) { steps.unshift({ deps: ['Core/polyfill'], callback: function () {} }) } function startApplication(steps) { let step = steps.shift(); require(step.deps, function(){ step.callback.apply(this, arguments); if (steps.length) { startApplication(steps); } }) } startApplication(steps); });</script></div>`
         const props = {
             dangerouslySetInnerHTML: {
                __html: start
             }
         };
         return ReactDOMServer.renderToString(React.createElement('div', props));
      }
      return ReactDOMServer.renderToString(this.createReactControl(origin, scope, _, __, deps));
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
   };

   escape<T>(value: T): T {
      return Common.escape(value);
   };
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
