import { GeneratorText } from './_Markup/Text/Generator';
import { GeneratorVdom } from './_Markup/Vdom/Generator';
import {IGeneratorConfig} from './_Markup/IGeneratorType';
import {IGenerator} from './_Markup/IGenerator';

/**
 * @author Тэн В.А.
 */
let _text, _vdom;

function Text(config: IGeneratorConfig): IGenerator {
   if (!_text) {
      _text = new GeneratorText(config);
   }
   return _text;
}
function Vdom(config) {
   if (!_vdom) {
      _vdom = new GeneratorVdom(config);
   }
   return _vdom;
}

export {
   Text,
   Vdom
};
