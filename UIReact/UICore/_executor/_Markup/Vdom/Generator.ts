import * as React from 'react';
import { Logger } from 'UICommon/Utils';
import {
   CommonUtils as Common,
   onElementMount,
   onElementUnmount,
   IGenerator,
   Attr,
} from 'UICommon/Executor';
import { convertAttributes, WasabyAttributes } from './Attributes';
import { IWasabyEvent } from 'UICommon/Events';
import { setEventHook } from 'UICore/Events';

import { Control, TemplateFunction } from 'UICore/Base';
import { IControlOptions } from 'UICommon/Base';
import { IGeneratorAttrs, TemplateOrigin, IControlConfig, AttrToDecorate } from './interfaces';
import { Generator } from '../Generator';

export class GeneratorVdom extends Generator implements IGenerator {
   prepareDataForCreate(tplOrigin: TemplateOrigin,
                        scope: IControlOptions,
                        attrs: IGeneratorAttrs,
                        deps: Common.Deps<typeof Control, TemplateFunction>,
                        includedTemplates?: Common.IncludedTemplates<TemplateFunction>): IControlOptions {
      if (tplOrigin === '_$inline_template') {
         // в случае ws:template отдаем текущие свойства
         return scope;
      }
      return undefined;
   }

   protected calculateOptions(
       resolvedOptionsExtended: IControlOptions,
       config: IControlConfig,
       events: Record<string, IWasabyEvent[]>,
       name: string): IControlOptions & {ref: unknown} {
      return {
         ...resolvedOptionsExtended,
         ...{events},
         ref: createChildrenRef(config.viewController, name)
      }
   }

   /*
   FIXME: не понимаю зачем нужен этот метод, по сути он ничего не делает.
   Вроде шаблонизатор не может сгенерировать вызов этого метода с чем-то отличным от строки.
    */
   createText(text: string): string {
      if (typeof text !== 'string') {
         /*
         FIXME: я считаю, что эта функция всегда зовётся со строкой и проверка бесполезна.
         Но т.к. она тут была, то удалять её немножко страшно, вдруг там реально были не вызовы не со строками.
         Ведь для реакта null и undefined это валидные ноды, но странно, если для них звался бы createText.
          */
         Logger.error(
             'Тут должна была прийти строка, нужно подняться по стеку и понять откуда здесь что-то другое'
         );
         return '';
      }
      return text;
   }

   /**
    * Получает конструктор контрола по его названию и создаёт его с переданными опциями.
    * @param origin Либо сам шаблон/конструктор контрола, либо строка, по которой его можно получить.
    * @param scope Опции контрола.
    * @param _
    * @param __
    * @param deps Объект с зависимостями контрола, в нём должно быть поле, соответствующее name.
    */
   createWsControl(
       origin: string | typeof Control,
       scope: IControlOptions,
       decorAttribs: IGeneratorAttrs,
       __: unknown,
       deps: Common.Deps<typeof Control, TemplateFunction>
   ): React.ComponentElement<
       IControlOptions,
       Control<IControlOptions, object>
       >  {
      return this.createReactControl(origin, scope, decorAttribs, __, deps);
   }

   /*
   FIXME: Изначально в joinElements было return ArrayUtils.flatten(elements, true).
   Он зовётся из каждого шаблона, так что нельзя просто взять и удалить.
   Вроде он нужен для тех случаев, когда partial вернёт вложенный массив. Я пытался возвращать
   несколько корневых нод из partial, возвращался просто массив из двух элементов.
   Так что пока этот метод ничего не делает.
    */
   joinElements(elements: React.ReactNode): React.ReactNode {
      if (Array.isArray(elements)) {
         return elements;
      } else {
         throw new Error('joinElements: elements is not array');
      }
   }

   /**
    * Строит DOM-элемент.
    * @param tagName Название DOM-элемента.
    * @param attrs Атрибуты DOM-элемента.
    * @param children Дети DOM-элемента.
    * @param _
    * @param __
    * @param control Инстанс контрола-родителя, используется для заполнения _children.
    */
   createTag<T extends HTMLElement, P extends React.HTMLAttributes<T>>(
       tagName: keyof React.ReactHTML,
       attrs: {
          attributes: P &
              WasabyAttributes & {
             name?: string;
          };
          events: Record<string, IWasabyEvent[]>
       },
       children: React.ReactNode[],
       attrToDecorate: AttrToDecorate,
       __: unknown,
       control?: Control
   ): React.DetailedReactHTMLElement<P, T> {
      /* если события объявляется на контроле, и корневом элементе шаблона, то мы должны смержить события,
       * без этого события объявленные на контроле будут потеряны
       */
      const extractedEvents = control ?
          {...control._options['events'], ...attrs.events} :
          {...attrs.events};
      const eventsObject = {
         events: extractedEvents,
      };
      if (!attrToDecorate) {
         attrToDecorate = {};
      }
      const mergedAttrs = Attr.mergeAttrs(attrToDecorate.attributes, attrs.attributes);
      Object.keys(mergedAttrs).forEach((attrName) => {
         if (!mergedAttrs[attrName]) {
            delete mergedAttrs[attrName];
         }
      });
      const name = mergedAttrs.name;
      const ref = createChildrenRef(
          control,
          name,
          createEventRef(tagName, eventsObject)
      );

      const convertedAttributes = convertAttributes(mergedAttrs);

      const newProps = {
         ...convertedAttributes,
         ...extractedEvents,
         ref
      };

      return React.createElement<P, T>(tagName, newProps, children.length ? children : undefined);
   }

   // FIXME: бесполезный метод, но он зовётся из шаблонов
   escape<T>(value: T): T {
      return value;
   }
}

function createEventRef<T extends HTMLElement>(
    tagName: string,
    eventsObject: {
       events: Record<string, IWasabyEvent[]>;
    },
    prevRef?: React.RefCallback<T>
): React.RefCallback<T> {
   return (node) => {
      prevRef?.(node);
      if (node && Object.keys(eventsObject.events).length > 0) {
         setEventHook(tagName, eventsObject, node);
      }
   };
}

function createChildrenRef<T extends Control | Element>(
    parent: Control,
    name: string,
    prevRef?: React.RefCallback<T>
): React.RefCallback<T> | void {
   // _children protected по апи, но здесь нужен доступ чтобы инициализировать.
   /* tslint:disable:no-string-literal */
   const oldRef = (node) => {
      prevRef?.(node);
   };
   if (parent && name) {
      return (node) => {
         oldRef(node);
         if (node) {
            parent['_children'][name] = node;
            onElementMount(parent['_children'][name]);
         } else {
            onElementUnmount(parent['_children'], name);
         }
      };
   }
   return oldRef;
   /* tslint:enable:no-string-literal */
}
