import { Context, createContext } from 'react';

export interface IWasabyContextValue {
   readOnly: boolean;
   theme: string;
}

export type TWasabyContext = Context<IWasabyContextValue>;

const defaultValue: IWasabyContextValue = {
   readOnly: false,
   theme: 'default'
};
/*
TODO: создание контекста должно происходить не при загрузке модуля, а в точке старта приложения,
но пока у нас нет для реакта нормальной точки старта.
 */
const wasabyContext: TWasabyContext = createContext(defaultValue);

/**
 * Возвращает инстанс контекста совместимости. Должно использоваться только в контроле совместимости,
 * все остальные места должны работать через соответствующие HOC'и или хуки.
 */
export function getWasabyContext(): TWasabyContext {
   return wasabyContext;
}
