import {memo} from 'react';
import {RecordSet} from 'Types/collection';

interface IChildProps {
    rs: RecordSet;
}

const Child = memo(({rs}: IChildProps) => {
    return <div>Количество записей {rs.getCount()}</div>;
});

export {
    Child
};
