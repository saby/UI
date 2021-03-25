import {createElement} from "react";
import {useVersionObservable} from 'UI/_react/Reactivity/MakeObservable';
import {Record} from "Types/entity";

const myRec = Record.fromObject({
    count: 0
});

export default function FunctionalComponent() {
    useVersionObservable([myRec]);
    return createElement('div', null,
        createElement('h3', null, 'Функциональный компонент с использованием useVersionObservable'),
        `Count: ${myRec.get('count')}`,
        createElement('button', {
            onClick: () => {
                myRec.set({
                    count: myRec.get('count') + 1
                });
            }
        }, 'Add'));
}
