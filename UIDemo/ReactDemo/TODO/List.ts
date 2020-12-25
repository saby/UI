import { createElement } from 'react';
import { Control, ITemplateFunction } from 'UI/ReactComponent';
import { IList } from './interfaces';
import Item, { IItem } from './Item';

const SLEEP_TIME = 1500;

export default class List extends Control<IList> {
  protected _beforeMount(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, SLEEP_TIME);
    });
  }

  protected _template: ITemplateFunction = (props: IList) => {
    return props.items.length
      ? createElement(
          'div',
          { className: 'todo-List' },
          props.items.map((el) =>
            createElement<IItem>(Item, {
              key: el.id,
              title: el.title,
              removeHandler: () => props.removeHandler(el.id),
            })
          )
        )
      : createElement('div', null, 'Список пуст');
  };
}
