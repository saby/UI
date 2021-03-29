import {createElement, PureComponent} from "react";
import {withVersionObservable} from "UI/ReactReactivity";
import {RecordSet} from "Types/collection";

interface IChildProps {
    rs: RecordSet
}

class ClassChild extends PureComponent<IChildProps> {
    render() {
        return createElement('div', {}, `Количество записей: ${this.props.rs.getCount()}`);
    }
}

const ClassChildWithVersionObserver = withVersionObservable<IChildProps>(ClassChild, ['rs']);

export {
    ClassChild,
    ClassChildWithVersionObserver
};
