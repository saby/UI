import {Component, createElement} from 'react';
import {RecordSet} from 'Types/collection';
import {Model} from 'Types/entity';
import {makeObservable, withVersionObservable, getReactiveVersionsProp} from 'UIReact/UICore/Reactivity';
import 'css!UICore/ReactDemo/Reactivity/Controller';
import FunctionalComponent from './FunctionalComponent';
import {Child} from './Child';
import {ClassChild} from './ClassChild';

export default class Controller extends Component<{}, { text: string }> {
    myRS = new RecordSet();

    constructor(props) {
        super(props);
        this.state = {
            text: ''
        };
        makeObservable(this, ['myRS']);
    }

    protected _addNew(): void {
        this.myRS.add(Model.fromObject({
            text: this.state.text,
            done: false
        }));
    }

    protected doneClick(el): void {
        el.set({
            done: !el.get('done')
        });
    }

    render() {
        let list = [];
        this.myRS.forEach((el, key) => {
            list.push(createElement('li', {key: key}, createElement('span', {
                    className: el.get('done') ? 'done' : ''
                },
                createElement('input', {
                    type: 'checkbox', value: el.get('done'), onChange: () => {
                        this.doneClick(el)
                    }
                }), el.get('text'))));
        });
        return createElement('div', null,
            createElement('h3', null, 'Классовый компонент с использованием makeObservable'),
            createElement('input', {
                type: 'text', value: this.state.text, onInput: (e: InputEvent) => {
                    this.setState({text: (e.target as HTMLInputElement).value});
                }
            }),
            createElement('button', {
                onClick: this._addNew.bind(this),
                disabled: this.state.text.trim().length <= 0
            }, 'Add new item'),
            createElement('ol', null, [...list]),
            createElement('h3', null, 'Memo компонент с использованием withVersionObserver'),
            createElement(withVersionObservable(Child, ['rs']), {rs: this.myRS}),
            createElement('h3', null, 'Memo компонент без использования withVersionObserver'),
            createElement(Child, {rs: this.myRS}),
            createElement('h3', null, 'Memo компонент c использованием метода getReactiveVersionsProp'),
            // @ts-ignore JSX поддерживает дата-аттрибуты, а вот createElement ругается
            createElement(Child, {rs: this.myRS, 'data-$$version': getReactiveVersionsProp(this.myRS)}),
            createElement('h3', null, 'PureClass компонент с использованием withVersionObserver'),
            createElement(withVersionObservable(ClassChild, ['rs']), {rs: this.myRS}),
            createElement('h3', null, 'PureClass компонент без использования withVersionObserver'),
            createElement(ClassChild, {rs: this.myRS}),
            createElement(FunctionalComponent));
    }
}
