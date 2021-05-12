import { pauseReactive } from 'UICommon/Executor';

export { makeObservable, useMakeObservable } from './_react/Reactivity/MakeObservable';
export { withVersionObservable, getReactiveVersionsProp } from './_react/Reactivity/withVersionObservable';

export const ReactiveObserver = {
    pauseReactive
};
