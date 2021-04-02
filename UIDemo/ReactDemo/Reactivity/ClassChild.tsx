import {PureComponent, ReactElement} from 'react';
import {RecordSet} from 'Types/collection';

interface IChildProps {
    rs: RecordSet;
}

class ClassChild extends PureComponent<IChildProps> {
    render(): ReactElement {
        return <div>Количество записей: {this.props.rs.getCount()}</div>;
    }
}

export {
    ClassChild
};
