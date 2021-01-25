import {IControlOptions} from 'UI/Base';

export interface IList extends IControlOptions {
    items: IItem[];
    removeHandler: Function;
}

export interface IItem {
    id: number;
    title: string;
}
