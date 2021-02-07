/**
 * @deprecated
 * @description Represents i18n methods.
 * @author Крылов М.А.
 * @file Compiler/expressions/i18n.ts
 *
 * @todo https://online.sbis.ru/opendoc.html?guid=72013f58-3b1b-4838-ba79-b8a75b6e9436
 */

const HTML_ENTITY_PATTERN = /^&[^\s;]+;$/;

const EXPRESSION_PATTERN = /\{\{ ?([\s\S]*?) ?\}\}/g;

const TRANSLATE = /\{\[([\s\S]+?)]}/g;

const EMPTY_STRING = '';

/**
 * Добавляет теги шаблонизатора к тексту, для перевода
 * @param text - текст для обрамления {[ ]}
 * @returns String
 */
function addTranslateTagToText(text: string): string {
   const temp = text.trim();

   // если текст уже локализован, ничего не делаем
   if (temp.indexOf('{[') !== -1) {
      return text;
   }
   return text.replace(temp, '{[' + temp + ']}');
}

function canBeTranslated(text: string): boolean {
   // Text is considered possible to translate if it is not:
   // 1. A variable: {{ someOption }}, Text with {{ option }}s - can't be translated
   // 2. A single html entity: &amp;, &#123 - shouldn't be translated
   //    (Text with html entities can be translated: String &amp; entity)
   // 3. An INCLUDE instruction: %{INCLUDE ...} - for compatibility

   // С флагом global у регулярного выражения нужно сбрасывать индекс
   EXPRESSION_PATTERN.lastIndex = 0;
   return !EXPRESSION_PATTERN.test(text) &&
      !HTML_ENTITY_PATTERN.test(text.trim()) &&
      text.indexOf('%{INCLUDE') === -1;
}

class DictionaryItem {
   key: string;
   context: string;
   module: string;

   constructor(text: string, fileName: string) {
      let key;
      let context;
      if (text.indexOf('@@') > -1) {
         // Значит в ключе содержится контекст
         context = text.substring(0, text.indexOf('@@'));
         key = text.substr(text.indexOf('@@') + 2);
      }
      this.key = key || text;
      this.context = context || EMPTY_STRING;
      this.module = fileName;
   }
}

// добавляет слово в словарь локализуемых слов
function addWord(text: string, words: DictionaryItem[], fileName: string): void {

   // С флагом global у регулярного выражения нужно сбрасывать индекс
   TRANSLATE.lastIndex = 0;
   text.replace(TRANSLATE, (match: any, value: any): any => {
      // FIXME: Почему здесь replace??? Не порядок
      words.push(new DictionaryItem(value, fileName));
   });
}

// tslint:disable:no-empty-interface
interface IComponentProperties {
   // TODO: Описать структуру документа, который передает saby-builder
}
// tslint:enable:no-empty-interface

export interface IJSDocComponentProperties {
   [componentName: string]: {
      properties: {
         'ws-config': {
            options: IComponentProperties;
         };
      };
   };
}

/**
 * Returns the JSDoc information for a component or a typedef
 * @param componentsProperties
 * @param {String} componentName component or typedef name
 * @return {Object} JSDoc information
 */
function getPropertiesInformation(
   componentsProperties: IJSDocComponentProperties,
   componentName: string
): IComponentProperties {
   return componentsProperties[componentName] && componentsProperties[componentName].properties['ws-config'].options;
}

// checks if data is localizable and adds it to the dictionary if it is
export function findLocaleVariables(data: any, config: any): any {
   let translatable = false;

   // С флагом global у регулярного выражения нужно сбрасывать индекс
   TRANSLATE.lastIndex = 0;
   if (TRANSLATE.test(data)) {
      // Text is already wrapped in {[ rk-brackets ]}, no need to check if it is localizable
      translatable = true;
   } else if (config._oldComponentInside === 0 && config._scriptInside === 0 && config._styleInside === 0) {
      // Check if component's option is localizable by checking the JSDoc for it. Localizable
      // options have "@translatable" label on them
      if (config.createResultDictionary && config._currentPartialName && config._currentPartialName.length) {
         const currentPartialName = config._currentPartialName[config._currentPartialName.length - 1];
         const jsDocOptions = getPropertiesInformation(config.componentsProperties, currentPartialName);
         const checkTranslatable = (jsDocInfo: any, optionNamesStack: any): any => {
            let currentOptionInfo = jsDocInfo;
            for (let i = 0; i < optionNamesStack.length && currentOptionInfo; i++) {
               const nextStep = optionNamesStack[i];
               const typedefName = currentOptionInfo.itemType || currentOptionInfo.arrayElementType;
               const hasATypedef = typeof typedefName === 'string';
               if (currentOptionInfo.translatable) {
                  // Every property of the translatable option is localizable, there is no
                  // need to continue checking - stop going through JSDoc
                  break;
               } else if (hasATypedef) {
                  currentOptionInfo = getPropertiesInformation(config.componentsProperties, typedefName);
               }
               if (currentOptionInfo) {
                  currentOptionInfo = currentOptionInfo[nextStep];
               }
            }
            if (canBeTranslated(data)) {
               return currentOptionInfo && currentOptionInfo.translatable;
            }
            return undefined;
         };
         translatable = jsDocOptions &&
            config._optionName &&
            checkTranslatable(jsDocOptions, config._optionName);
      } else {
         // If config is not a component's option, mark text as localizable if it is a simple
         // text node (config._optionName is missing), or if it is the `title` attribute of
         // a tag (_optionName[0] === 'title', title is always localizable)
         translatable = canBeTranslated(data) && (
            !config._optionName || !config._optionName[0] || config._optionName[0] === 'title'
         );
      }
   }
   let returnResult = data;
   if (translatable) {
      // Wrap the text with {[ rk-brackets ]} (if possible) and add it to the dictionary
      returnResult = addTranslateTagToText(returnResult);
      if (config.createResultDictionary) {
         addWord(returnResult, config.words, config.fileName);
      }
   }
   return returnResult;
}
