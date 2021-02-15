/*
FIXME: весь файл создан как костыль, чтобы убрать реакт из статических зависимостей UI/Executor
и внедрять его извне.
*/
import { TClosure } from 'UI/Executor';
import { GeneratorReact } from 'UI/_executor/_Markup/React/Generator';

let _react;

function React(): GeneratorReact {
   if (!_react) {
      _react = new GeneratorReact();
   }
   return _react;
}

/**
 * Внедряет в TClosure реактовский генератор.
 * @param value Включить/выключить реакт.
 */
export function setReactGenerator(value: boolean): void {
   if (value) {
      TClosure.setReactGenerator(React());
   } else {
      TClosure.setReactGenerator();
   }
}
