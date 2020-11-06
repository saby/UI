/// <amd-module name="UI/_builder/Tmpl/expressions/_private/Process" />

/**
 * @author Крылов М.А.
 */

import { createErrorHandler } from 'UI/_builder/Tmpl/utils/ErrorHandler';
import { ILexicalContext, needOptimizeProgramProcessing } from 'UI/_builder/Tmpl/core/Context';
import { LocalizationNode, TextNode, VariableNode } from './Statement';
import { ProgramNode, ExpressionVisitor } from './Nodes';
import { genEscape } from 'UI/_builder/Tmpl/codegen/Generator';
import { genSanitize, genInitExpressions } from 'UI/_builder/Tmpl/codegen/TClosure';

import * as common from 'UI/_builder/Tmpl/modules/utils/common';
import * as FSC from 'UI/_builder/Tmpl/modules/data/utils/functionStringCreator';

const EMPTY_STRING = '';
const errorHandler = createErrorHandler(true);

function splitLocalizationText(text: string, fileName: string): { text: string, context: string } {
   const pair = text.split('@@');
   if (pair.length > 2) {
      errorHandler.error(
         `Ожидался только 1 @@-разделитель в конструкции локализации, а обнаружено ${pair.length - 1} разделителей в тексте "${text}"`,
         {
            fileName
         }
      );
   }
   return {
      text: (pair.pop() || EMPTY_STRING).trim(),
      context: (pair.pop() || EMPTY_STRING).trim()
   };
}

function wrapWithLocalization(data: string, fileName: string): string {
   // FIXME: строковые литералы идут сразу в кавычках.
   //  Так не должно быть! Убираем их перед разбором.
   const text = data
      .replace(/^"/gi, '')
      .replace(/"$/gi, '');
   const prepared = splitLocalizationText(text, fileName);
   if (prepared.context) {
      return `rk("${prepared.text}", "${prepared.context}")`;
   }
   return `rk("${prepared.text}")`;
}

function calculateResultOfExpression(data: any, escape: boolean, sanitize: boolean): any {
   if (typeof data === 'string') {
      if (escape) {
         return genEscape(data);
      }
      if (sanitize) {
         return genSanitize(data);
      }
      return data;
   }
   return data;
}

function resolveExpressionValue(body: any, res: any, composite: boolean): string {
   if (typeof res !== 'string') {
      return FSC.wrapAroundEntity(JSON.stringify(res));
   }
   if (body.expression.type === 'ObjectExpression' || body.expression.type === 'ArrayExpression') {
      return FSC.wrapAroundObject(res);
   }
   if (composite) {
      return res;
   }
   return FSC.wrapAroundExec(res, true);
}

/**
 *
 * @param expressionRaw
 * @param data ???
 * @param fileName
 * @param isControl
 * @param configObject Атрибуты текущего контрола
 * @param attributeName
 * @param isAttribute
 */
export function processExpressions(
   expressionRaw: TextNode | VariableNode | LocalizationNode,
   data: any,
   fileName: string,
   isControl?: boolean,
   configObject?: any,
   attributeName?: string,
   isAttribute?: boolean
): any {
   let res;
   const esc = !(configObject && configObject.esc !== undefined);

   // FIXME: Делаем клонирование в другом месте и теряем прототип! instanceof работать не будет
   const exprAsLocalization = expressionRaw as LocalizationNode;
   const exprAsVariable = expressionRaw as VariableNode;

   const visitor = new ExpressionVisitor();

   if (exprAsLocalization.type === 'var' && exprAsLocalization.localized) {
      // экранируем двойную кавычку, чтобы она не сломала синтаксис функции
      // (строка будет обернута в двойные кавычки, а внутри этой строки будут экранированные двойные кавычки)
      res = exprAsLocalization.name
         .replace(/\\/g, '\\\\')
         .replace(/"/g, '\\"');
      res = FSC.wrapAroundQuotes(res);
      res = wrapWithLocalization(res, fileName);
      exprAsLocalization.value = FSC.wrapAroundExec(res, true);
      return res;
   }

   if (exprAsVariable.type === 'var') {
      if (exprAsVariable.name instanceof ProgramNode) {
         if (configObject && !isAttribute) {
            exprAsVariable.noEscape = true;
         }
         const context = {
            fileName,
            attributeName,
            isControl,
            isExprConcat: false,
            configObject: configObject || {},
            escape: esc,
            sanitize: true,
            getterContext: 'data',
            forbidComputedMembers: false,

            // TODO: есть ли необходимость в этих знаниях следующему кодогенератору???
            childrenStorage: [],
            checkChildren: false
         };
         const exprId = exprAsVariable.name.__$ws_id;
         if (exprId === null || !needOptimizeProgramProcessing()) {
            res = exprAsVariable.name.accept(visitor, context);
         } else {
            res = `${EXPRESSIONS_VARIABLE_NAME}.${exprId}`;
         }
         if (!exprAsVariable.noEscape) {
            res = calculateResultOfExpression(res, context.escape, context.sanitize);
         }
         exprAsVariable.value = resolveExpressionValue(
            exprAsVariable.name.body[0], res, context.configObject.composite
         );
         return res;
      } else {
         errorHandler.error(
            'Something wrong with the expression given',
            {
               fileName
            }
         );
         return undefined;
      }
   }

   if (expressionRaw.value && isAttribute) {
      res = expressionRaw.value;
      res = res
         .replace(/\\/g, '\\\\')
         .replace(/"/g, '\\"');
      res = common.escape(res);
      return res;
   }

   return expressionRaw.value;
}

export function processProgramNode(program: ProgramNode, fileName: string): string {
   const context = {
      fileName,
      attributeName: undefined,
      isControl: undefined,
      generateSafeFunctionCall: true,
      isExprConcat: false,
      configObject: {},
      escape: undefined,
      sanitize: true,
      getterContext: 'data',
      forbidComputedMembers: false,

      // TODO: есть ли необходимость в этих знаниях следующему кодогенератору???
      childrenStorage: [],
      checkChildren: false
   };
   const visitor = new ExpressionVisitor();
   return <string>program.accept(visitor, context);
}

const EXPRESSIONS_VARIABLE_NAME = '$P';
const DEFAULT_EMPTY_VALUE = '""';

export function generateExpressionsBlock(context: ILexicalContext, fileName: string): string {
   if (!needOptimizeProgramProcessing()) {
      return EMPTY_STRING;
   }
   const items: { key: string; value: string; }[] = [];
   const keys = context.getLocalProgramKeys();
   for (let index = 0; index < keys.length; ++index) {
      const key = keys[index];
      const program = context.getProgram(key);
      context.commitProcessing(key);
      const value = processProgramNode(program, fileName);
      if (!value) {
         items.push({ key, value: DEFAULT_EMPTY_VALUE });
         continue;
      }
      items.push({ key, value });
   }
   const properties: string = items.map((item) => `"${item.key}":${item.value}`).join(',');
   const programs: string = `{${properties}}`;
   return `var ${EXPRESSIONS_VARIABLE_NAME} = ${genInitExpressions(programs)};`;
}
