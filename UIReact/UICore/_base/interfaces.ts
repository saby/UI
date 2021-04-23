import { _IGeneratorType } from 'UICommon/Executor';

// TODO: в 3000 исправить тип возвращаемого значения, вынести в UICommon. Только string для совместимости.
export type TemplateFunction = (
   data: object,
   attr?: object,
   context?: string,
   isVdom?: boolean,
   sets?: object,
   forceCompatible?: boolean,
   generatorConfig?: _IGeneratorType.IGeneratorConfig
) => string;

export interface IControlState {
   loading: boolean;
   observableVersion: number;
}
