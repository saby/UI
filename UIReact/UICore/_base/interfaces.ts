import { _IGeneratorType } from 'UICommon/Executor';

export interface IControlState {
   loading: boolean;
   observableVersion: number;
   hasError: boolean;
   error: void | Error;
}
