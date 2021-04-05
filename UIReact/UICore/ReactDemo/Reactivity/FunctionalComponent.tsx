import {ReactElement} from 'react';
import {useMakeObservable} from 'UICore/Reactivity';
import {Record} from 'Types/entity';

const myRec = Record.fromObject({
    count: 0
});

export default function FunctionalComponent(): ReactElement {
    useMakeObservable([myRec]);
    return <div>
        <h3>Функциональный компонент с использованием useMakeObservable</h3>
        <div>
            Count: {myRec.get('count')}
            <button onClick={() => {
                myRec.set({
                    count: myRec.get('count') + 1
                });
            }}>Add
            </button>
        </div>
    </div>;
}
