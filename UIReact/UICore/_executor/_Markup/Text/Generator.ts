/// <amd-module name="UICore/_executor/_Markup/Text/Generator" />
import {
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
}
