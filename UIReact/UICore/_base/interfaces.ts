import { _IGeneratorType } from 'UICommon/Executor';

export type TemplateFunction = (
   data: object,
   attr?: object,
   context?: string,
   isVdom?: boolean,
   sets?: object,
   forceCompatible?: boolean,
   generatorConfig?: _IGeneratorType.IGeneratorConfig
) => string | object;

export interface IControlState {
   loading: boolean;
   observableVersion: number;
}
