import {createElement, memo} from "react";
import {RecordSet} from "Types/collection";

interface IChildProps {
    rs: RecordSet
}

const Child = memo(function({rs}: IChildProps) {
    console.log('Child render');
    return createElement('div', {}, `Количество записей: ${rs.getCount()}`);
});

export {
    Child
};
