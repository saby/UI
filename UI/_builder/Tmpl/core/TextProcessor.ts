/// <amd-module name="UI/_builder/Tmpl/core/TextProcessor" />

/**
 * @author Крылов М.А.
 */

import { splitLocalizationText } from './i18n';
import {
   TText,
   TranslationNode,
   TextDataNode,
   ExpressionNode
} from './Ast';
import { IParser } from 'UI/_builder/Tmpl/expressions/_private/Parser';

const VARIABLES_PATTERN = /\{\{ ?([\s\S]*?) ?\}\}/g;
const LOCALIZATION_PATTERN = /\{\[ ?([\s\S]*?) ?\]\}/g;

declare type TWrapper = (data: string) => TText;

function createTranslationNode(data: string): TranslationNode {
   const { text, context } = splitLocalizationText(data);
   return new TranslationNode(text, context);
}

function createTextNode(data: string): TextDataNode {
   return new TextDataNode(data);
}

function markDataByRegex(
   nodes: TText[],
   regex: RegExp,
   targetWrapper: TWrapper,
   defaultWrapper: TWrapper
): TText[] {
   let item;
   let value;
   let last;
   const data = [];
   for (let idx = 0; idx < nodes.length; ++idx) {
      if (!(nodes[idx] instanceof TextDataNode)) {
         data.push(nodes[idx]);
         continue;
      }

      const stringData = (<TextDataNode>nodes[idx]).__$ws_content;

      regex.lastIndex = 0;
      last = 0;
      while ((item = regex.exec(stringData))) {
         if (last < item.index) {
            value = stringData.slice(last, item.index);
            data.push(defaultWrapper(value));
         }
         data.push(targetWrapper(item[1]));
         last = item.index + item[0].length;
      }

      if (last === 0) {
         data.push(nodes[idx]);
      } else if (last < stringData.length) {
         value = stringData.slice(last);
         data.push(defaultWrapper(value));
      }
   }
   return data;
}

export function processTextData(text: string, expressionParser: IParser): TText[] {
   const processedText = [
      new TextDataNode(text)
   ];

   const processedExpressions = markDataByRegex(
      processedText,
      VARIABLES_PATTERN,
      (data: string) => new ExpressionNode(expressionParser.parse(data)),
      createTextNode
   );

   return markDataByRegex(
      processedExpressions,
      LOCALIZATION_PATTERN,
      createTranslationNode,
      createTextNode
   );
}

export function cleanMustacheExpression(text: string): string {
   return text
      .replace(/^\s*{{\s*/i, '')
      .replace(/\s*}}\s*$/i, '');
}
