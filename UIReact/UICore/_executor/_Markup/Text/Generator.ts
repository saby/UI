/// <amd-module name="UICore/_executor/_Markup/Text/Generator" />
import {
   CommonUtils,
   IGenerator
} from 'UICommon/Executor';

/**
 * @author Тэн В.А.
 */
export class GeneratorText implements IGenerator {
   createText(value: string): string {
      return value;
   }

   createDirective(value: string): string {
      return '<' + value + '>';
   }

   escape(value: string): string {
      return CommonUtils.escape(value);
   }
}
