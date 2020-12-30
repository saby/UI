import { Control, IControlOptions } from 'UI/Base';
import { Logger } from 'UI/Utils';

export type IControlChildren = Record<string, Element | Control | Control<IControlOptions, {}>>;

/**
 * Создает proxy объект для отслеживания обращения к дочерним компонентам
 */
export function getProxyChildren(): IControlChildren {
  const moduleName = this._moduleName;
  // IE11 не поддерживает Proxy, возвращаем в таком случае простой объект
  if (Proxy === undefined) {
    return {};
  }
  return new Proxy({}, {
    get(target: object, prop: string, receiver: unknown): unknown {
      if (!(prop in target)) {
        let message = `Попытка обращения к дочернему компоненту: "${prop.toString()}" которого не существует.`;
        if (moduleName) {
          message = `${message} Проверьте шаблон компонента: ${moduleName}`;
        }
        Logger.warn(message);
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}
