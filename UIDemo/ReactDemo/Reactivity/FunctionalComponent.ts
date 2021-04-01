import {createElement} from "react";
import {useMakeObservable} from 'UI/ReactReactivity';
import {Record} from "Types/entity";

const myRec = Record.fromObject({
    count: 0
});

export default function FunctionalComponent() {
    useMakeObservable([myRec]);
    return createElement('div', null,
        createElement('h3', null, 'Функциональный компонент с использованием useMakeObservable'),
        `Count: ${myRec.get('count')}`,
        createElement('button', {
            onClick: () => {
                myRec.set({
                    count: myRec.get('count') + 1
                });
            }
        }, 'Add'));
}
