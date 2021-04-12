
import { Control } from 'UICore/Base';

export interface IControlOptions {
    readOnly?: boolean;
    theme?: string;
    _$createdFromCode?: boolean;
}

export type IControlChildren = Record<string, Element | Control | Control<IControlOptions, {}>>;
