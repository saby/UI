/// <amd-module name="UI/_builder/Tmpl/expressions/_private/Process" />

/**
 * @author Крылов М.А.
 */

import { createErrorHandler } from 'UI/_builder/Tmpl/utils/ErrorHandler';
import { LocalizationNode, TextNode, VariableNode } from './Statement';
import { ProgramNode, ExpressionVisitor } from './Nodes';
import { genEscape } from 'UI/_builder/Tmpl/codegen/Generator';
import { genSanitize } from 'UI/_builder/Tmpl/codegen/TClosure';
import * as FSC from 'UI/_builder/Tmpl/modules/data/utils/functionStringCreator';
import { isPreliminaryCalculationAllowed, IContext } from 'UI/_builder/Tmpl/core/Context';

const EMPTY_STRING = '';
const errorHandler = createErrorHandler(true);

const tagsToReplace = {
   "'": "\\'",
   '"': '\\"',
   '\\': '\\\\'
};
const regExpToReplace = /['"\\]/g;

export function escapeQuotesInString(entity: any): any {
   if (entity && entity.replace) {
      return entity.replace(regExpToReplace, (tag: string) =>  tagsToReplace[tag] || tag);
   }
   return entity;
}

const localizationRegExp = /^(\s*)(?:([\S\s]*?)\s*@@\s*)?([\S\s]*?)(\s*)$/;

function splitLocalizationText(text: string, fileName: string): { text: string, context: string, spacesBefore: string, spacesAfter: string } {
   const [match, spacesBefore, context, splitedText, spacesAfter]: string[] = localizationRegExp.exec(text);
   if (splitedText.indexOf('@@') !== -1) {
      errorHandler.error(
         `Ожидался только 1 @@-разделитель в конструкции локализации, в тексте "${match}" найдено больше`,
         {
            fileName
         }
      )
   }
   return {
      text: splitedText || EMPTY_STRING,
      context: context || EMPTY_STRING,
      spacesBefore,
      spacesAfter
   }
}

function wrapWithLocalization(data: string, fileName: string): string {
   // FIXME: строковые литералы идут сразу в кавычках.
   //  Так не должно быть! Убираем их перед разбором.
   const text = data
      .replace(/^"/gi, '')
      .replace(/"$/gi, '');
   const prepared = splitLocalizationText(text, fileName);
   const context = prepared.context ? `, "${prepared.context}"` : EMPTY_STRING;
   const spacesBefore = prepared.spacesBefore ? `"${prepared.spacesBefore}" + ` : EMPTY_STRING;
   const spacesAfter = prepared.spacesAfter ? `+ "${prepared.spacesAfter}"` : EMPTY_STRING;
   return `${spacesBefore}rk("${prepared.text}"${context})${spacesAfter}`;
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
         const programKey = exprAsVariable.name.__$ws_id;
         const usePreliminaryCalculation = programKey !== null && isPreliminaryCalculationAllowed();
         const context = {
            fileName,
            generateSafeFunctionCall: usePreliminaryCalculation,
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
         res = exprAsVariable.name.accept(visitor, context);
         if (usePreliminaryCalculation) {
            exprAsVariable.name.__$ws_lexicalContext.commitCode(programKey, res);
            res = programKey;
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
      return escapeQuotesInString(expressionRaw.value);
   }

   return expressionRaw.value;
}

function processProgramNode(program: ProgramNode, fileName: string): string {
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

export function generateExpressionsBlock(context: IContext, fileName: string): string {
   if (!isPreliminaryCalculationAllowed()) {
      return EMPTY_STRING;
   }
   const initializers: string[] = [];
   const programs = context.getPrograms(true);
   for (let index = 0; index < programs.length; ++index) {
      const meta = programs[index];
      let code = meta.code;
      if (meta.code === null) {
         code = processProgramNode(meta.node, fileName);
         context.commitCode(meta.key, code);
      }
      initializers.push(`var ${meta.key} = ${code};`);
   }
   return initializers.join(EMPTY_STRING);
}
