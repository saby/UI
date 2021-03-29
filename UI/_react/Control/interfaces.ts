import { _IGeneratorType } from 'UI/Executor';
import { IWasabyEventSystem } from 'UI/Events';

export type TemplateFunction = (
   data: object,
   attr?: object,
   context?: string,
   isVdom?: boolean,
   sets?: object,
   forceCompatible?: boolean,
   generatorConfig?: _IGeneratorType.IGeneratorConfig
) => string | object;

export interface IControlOptions {
   readOnly?: boolean;
   theme?: string;
   eventSystem?: IWasabyEventSystem;
}

export interface IControlState {
   loading: boolean;
}
