export { makeObservable, useMakeObservable } from './_react/Reactivity/MakeObservable';
export { withVersionObservable, getReactiveVersionsProp } from './_react/Reactivity/withVersionObservable';

export const ReactiveObserver = {
    pauseReactive: (_: any, func: Function) => {
        func();
    }
};
