import { Control } from './Compatible';
import { IControlOptions } from './Compatible';

// Следим за изменением свойств инстанса для обновления контрола
export function reactiveObserve<P = IControlOptions, S = {}>(inst: Control<P, S>, reactiveProps: string[]): void {
  const reactiveValues = {};
  reactiveProps.forEach((prop) => {
      reactiveValues[prop] = inst[prop];
      Object.defineProperty(inst, prop, {
          enumerable: true,
          configurable: true,
          get: function reactiveGetter(): unknown {
              return reactiveValues[prop];
          },
          set: function reactiveSetter(value: unknown): void {
              if (reactiveValues[prop] !== value) {
                 //@ts-ignore
                  if (inst._reactiveStart) {
                      reactiveValues[prop] = value;
                      inst.forceUpdate();
                  }
              }
          }
      });
  });
}
