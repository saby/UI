import {IControlOptions} from 'UI/ReactComponent';

export interface IList extends IControlOptions {
    items: IItem[];
    removeHandler: Function;
}

export interface IItem {
    id: number;
    title: string;
}
