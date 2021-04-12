/// <amd-module name="UICore/_executor/_Markup/Text/Generator" />
import {
   CommonUtils,
   IGenerator
} from 'UICommon/Executor';
import { IControlOptions } from 'UICommon/interfaces';

/**
 * @author Тэн В.А.
 */
export class GeneratorText implements IGenerator {
   createText(text: string): string {
      return text;
   }

   createDirective(text: string): string {
      return '<' + text + '>';
   }

   escape(value: string): string {
      return CommonUtils.escape(value);
   }

   createComment(text: string): string {
      return '<!--' + text + '-->';
   }

   createTag(tag: string): string {
      return this.createDirective(tag);
   }

   getScope(data: any): any {
      return data;
   }

   prepareDataForCreate(): IControlOptions {
      return undefined;
   }

   createControl(): string {
      return '<div></div>';
   }

   createControlNew(): string {
      return '<div></div>';
   }
}
