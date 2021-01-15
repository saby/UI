import {IControlOptions} from 'UI/ReactComponent';
import {Guid} from 'Types/entity';

export interface IList extends IControlOptions {
    items: IItem[];
    removeHandler: Function;
    changeHandler: Function;
}

export interface IItem {
    id: Guid;
    title: string;
    checked: boolean;
}
