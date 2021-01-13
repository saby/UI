import { GeneratorText } from './_Markup/Text/Generator';
import { GeneratorVdom } from './_Markup/Vdom/Generator';
import { GeneratorReact } from './_Markup/React/Generator';
import {IGeneratorConfig} from "./_Markup/IGeneratorType";
import {IGenerator} from "./_Markup/IGenerator";

/**
 * @author Тэн В.А.
 */
let _text, _vdom, _react;

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
function React(config) {
   if (!_react) {
      _react = new GeneratorReact(config);
   }
   return _react;
}

export {
   Text,
   Vdom,
   React
};
