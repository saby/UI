import { Logger } from 'UI/Utils';

const hasProxy = typeof Proxy !== 'undefined';
const hasReflect = typeof Reflect !== 'undefined';

/**
 * Создает proxy объект для отслеживания обращения к дочерним компонентам
 */
export function getProxyChildren<T>(): T | {} {
  const moduleName = this._moduleName;
  // IE11 не поддерживает Proxy, возвращаем в таком случае простой объект
  if (!hasProxy) {
    return {};
  }
  return new Proxy({}, {
    get(target: object, prop: string, receiver: unknown): unknown {
      if (!(prop in target)) {
        let message = `Попытка обращения к дочернему контролу: "${prop.toString()}" которого не существует.`;
        if (moduleName) {
          message = `${message} Проверьте шаблон контрола: ${moduleName}`;
        }
        Logger.warn(message);
      }
      return hasReflect ? Reflect.get(target, prop, receiver) : target[prop];
    }
  });
}
