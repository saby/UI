import {Component, FormEvent, ReactElement} from 'react';
import {RecordSet} from 'Types/collection';
import {Model} from 'Types/entity';
import {makeObservable, withVersionObservable, getReactiveVersionsProp} from 'UICore/Reactivity';
import 'css!UIDemo/ReactDemo/Reactivity/Controller';
import FunctionalComponent from './FunctionalComponent';
import {Child} from './Child';
import {ClassChild} from './ClassChild';

export default class Controller extends Component<{}, { text: string }> {
    myRS: RecordSet = new RecordSet();

    constructor(props: object) {
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

    protected doneClick(el: Model): void {
        el.set({
            done: !el.get('done')
        });
    }

    render(): ReactElement {
        const list = [];
        const ChildWithHoc = withVersionObservable(Child, ['rs']);
        const ChildClassWithHoc = withVersionObservable(ClassChild, ['rs']);
        this.myRS.forEach((item, key) => {
            list.push(<li key={key}>
                        <span className={item.get('done') ? 'done' : ''}>
                            <input type="checkbox" value={item.get('done')} onChange={() => {
                                this.doneClick(item);
                            }}/> {item.get('text')}</span>
            </li>);
        });
        return <div>
            <h3>Классовый компонент с использованием makeObservable</h3>
            <input type="text" value={this.state.text} onInput={(e: FormEvent<HTMLInputElement>) => {
                this.setState({text: (e.target as HTMLInputElement).value});
            }}/>
            <button onClick={this._addNew.bind(this)} disabled={this.state.text.trim().length <= 0}>Add new item
            </button>
            <ol>
                {...list}
            </ol>
            <h3>Memo компонент с использованием withVersionObserver</h3>
            <ChildWithHoc rs={this.myRS}/>
            <h3>Memo компонент c использованием метода getReactiveVersionsProp</h3>
            <Child rs={this.myRS} data-$$version={getReactiveVersionsProp([this.myRS])}/>
            <h3>PureClass компонент с использованием withVersionObserver</h3>
            <ChildClassWithHoc rs={this.myRS}/>
            <h3>PureClass компонент без использования withVersionObserver</h3>
            <ClassChild rs={this.myRS}/>
            <FunctionalComponent/>
        </div>;
    }
}
