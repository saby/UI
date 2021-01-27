import {IControlOptions} from 'UI/Base';
import {Guid} from 'Types/entity';

export interface IList extends IControlOptions {
   items: IItem[];
   removeHandler: Function;
}

export interface IItem {
   id: Guid;
   title: string;
   checked: boolean;
}
