import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import * as template from 'wml!UI/_hotKeys/KeyStop';
import { SyntheticEvent } from 'Vdom/Vdom';

interface IKeyStopItem {
   keyCode: number;
}

interface IKeyStopOptions extends IControlOptions {
   stopKeys: IKeyStopItem[];
}

/**
 * Контрол, который позволяет предотвращать всплытие событий нажатий на клавиши
 * @class UI/_hotKeys/KeyStop
 * @extends UI/Base:Control
 * @public
 * @author Шипин А.А.
 */
export default class KeyStop extends Control<IKeyStopOptions> {
   protected _template: TemplateFunction = template;

   private _keydownHandler(event: SyntheticEvent<KeyboardEvent>): void {
      const keys = this._options.stopKeys || [];

      if (keys.find((key) => key.keyCode === event.nativeEvent.keyCode)) {
         event.stopped = true;
      }
   }
}