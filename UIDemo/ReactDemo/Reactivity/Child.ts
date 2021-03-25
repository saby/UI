import {createElement, memo} from "react";
import {withVersionObservable} from "UI/ReactReactivity";
import {RecordSet} from "Types/collection";

interface IChildProps {
    rs: RecordSet
}

const Child = memo(function({rs}: IChildProps) {
    console.log('Child render');
    return createElement('div', {}, `Количество записей: ${rs.getCount()}`);
});

const ChildWithVersionObserver = withVersionObservable<IChildProps>(Child, ['rs']);

export {
    Child,
    ChildWithVersionObserver
};
