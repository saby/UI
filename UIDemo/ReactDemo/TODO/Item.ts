import { createElement } from 'react';
import { Control, IControlOptions, ITemplateFunction } from 'UI/ReactComponent';
import 'css!UIDemo/ReactDemo/TODO/Item';

export interface IItem extends IControlOptions<Item> {
  title: string;
  removeHandler: Function;
}

export default class Item extends Control<IItem> {
  protected checked: boolean = false;

  constructor(props: IItem) {
    super(props);
    this._template.reactiveProps = ['checked'];
  }

  protected _template: ITemplateFunction = (props: IItem) => {
    return createElement(
      'div',
      {
        className: 'item'
      },
      [
        createElement('input', {
          type: 'checkbox',
          checked: props._$wasabyInstance.checked,
          key: 'checkbox',
          className: 'item-checkbox',
          onClick: () => props._$wasabyInstance._changeHandler()
        }),
        createElement(
          'span',
          {
            key: 'caption',
            className: `item-caption ${props._$wasabyInstance.checked ? 'item-caption__checked' : ''}`,
            onClick: () => props._$wasabyInstance._changeHandler()
          },
          props.title
        ),
        createElement(
          'button',
          {
            className: 'item-button',
            key: 'delete-button',
            onClick: () => props.removeHandler()
          },
          'Удалить'
        ),
      ]
    );
  };

  protected _changeHandler(): void {
    this.checked = !this.checked;
  }
}
