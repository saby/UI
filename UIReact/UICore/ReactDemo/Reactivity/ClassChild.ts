import {createElement, PureComponent} from "react";
import {RecordSet} from "Types/collection";

interface IChildProps {
    rs: RecordSet
}

class ClassChild extends PureComponent<IChildProps> {
    render() {
        return createElement('div', {}, `Количество записей: ${this.props.rs.getCount()}`);
    }
}

export {
    ClassChild
};
