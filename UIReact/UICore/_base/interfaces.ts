import { IErrorConfig } from 'UICore/_base/errorProcessors';

export interface IControlState {
   loading: boolean;
   observableVersion: number;
   hasError?: boolean;
   error?: void | Error;
   errorConfig: IErrorConfig;
}
