import { GeneratorText } from './_Markup/Text/Generator';
import { GeneratorVdom } from './_Markup/Vdom/Generator';
import {
   IGeneratorConfig,
   IGenerator
} from 'UICommon/Executor';

/**
 * @author Тэн В.А.
 */
let _text: IGenerator;
let _vdom: IGenerator;

function Text(config: IGeneratorConfig): IGenerator {
   // if (!_text) {
      _text = new GeneratorText(config);
   // }
   return _text;
}
function Vdom(config?: IGeneratorConfig): IGenerator {
   // if (!_vdom) {
      _vdom = new GeneratorVdom();
   // }
   return _vdom;
}

export {
   Text,
   Vdom
};
