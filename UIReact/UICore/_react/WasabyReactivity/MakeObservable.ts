import { Control, TemplateFunction } from 'UICore/Base';
import { IVersionable } from 'Types/entity';

const arrayMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];

/**
 * Запуск реактивности в WasabyReact компоненте
 * @param instance - Инстанс компонента, который необходимо перерисовывать
 */
export function makeWasabyObservable<P, S extends object | void>(instance: Control<P, S>): void {
    observeTemplate(instance);
    observeProps(instance);
}

/**
 * Подписка на изменение шаблона, при этом необходимо почистить старые подписки и подписаться на изменения новых
 * реактивных свойств
 * @param instance
 */
function observeTemplate<P, S extends object | void>(instance: Control<P, S>): void {
    // @ts-ignore _template сейчас _protected
    let templateFunction = instance._template;
    Object.defineProperty(instance, '_template', {
        enumerable: true,
        configurable: true,
        get(): TemplateFunction {
            return templateFunction;
        },
        set(newTemplateFunction: TemplateFunction): void {
            // @ts-ignore _template сейчас _protected
            if (newTemplateFunction !== templateFunction && newTemplateFunction && newTemplateFunction.reactiveProps) {
                templateFunction = newTemplateFunction;
                releaseProperties(instance);
                observeProps(instance);
                instance._forceUpdate();
            }
        }
    });
}

/**
 * Подписка на изменение свойств компонента
 * @param instance - Инстанс компонента
 */
function observeProps<P, S extends object | void>(instance: Control<P, S>): void {
    // @ts-ignore _template сейчас _protected
    const props = instance._template ? instance._template.reactiveProps : [];
    if (!instance.reactiveValues) {
        instance.reactiveValues = {};
    }
    props.forEach((propName) => {
        const descriptor = getDescriptor(instance, propName);
        const value = instance[propName];
        instance.reactiveValues[propName] = instance[propName];
        Object.defineProperty(instance, propName, {
            enumerable: true,
            configurable: true,
            set(newVal: unknown): void {
                if (descriptor?.set) {
                    descriptor.set.apply(this, arguments);
                }
                this.reactiveValues[propName] = newVal;
                checkMutableTypes(newVal as IVersionable | unknown[], instance, propName);
                instance._forceUpdate();
            },
            get(): unknown {
                if (descriptor?.get) {
                    return descriptor.get.apply(this, arguments);
                }
                return instance.reactiveValues[propName];
            }
        });
        checkMutableTypes(value, instance, propName);
    });
}

/**
 * Проверка, если тип свойства мутабельный (Array, Record, RecordSet), то необходимо вызвать для них соответственные методы
 * @param value - Значение свойства
 * @param instance - Инстанс компонента
 * @param propName - Имя свойства
 */
function checkMutableTypes<P, S extends object | void>(value: IVersionable | unknown[],
                                                       instance: Control<P, S>, propName: string): void {
    // @ts-ignore
    if (value && value._reactiveInstance) {
        // Обновляем только первый подписавшийся объект
        return;
    }
    if (Array.isArray(value)) {
        setObservableArray(value, instance, propName);
        // @ts-ignore _version сейчас protected
    } else if (value && typeof value._version === 'number') {
        setObservableVersion<P, S>(value, instance);
    }
}

/**
 * Подписываемся на изменение версии у версионируемых объектов и перерисовываем компонент
 * @param value - Значение свойства
 * @param instance - Инстанс компонента
 */
function setObservableVersion<P, S extends object | void>(value: IVersionable, instance: Control<P, S>): void {
    // @ts-ignore _version сейчас protected
    let currentValue = value._version;
    Object.defineProperty(value, '_version', {
        enumerable: true,
        configurable: true,
        set(val: number): void {
            currentValue = val;
            instance._forceUpdate();
        },
        get(): number {
            return currentValue;
        }
    });
    Object.defineProperties(value, {
        _reactiveInstance: {
            value: instance,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
}

/**
 * Подписываемся на вызов методов массива, для перерисовки после изменения
 * @param value - Значение свойства
 * @param instance - Инстанс компонента
 * @param propName - Имя свойства
 */
function setObservableArray<P, S extends object | void>(value: unknown[], instance: Control<P, S>,
                                                        propName: string): void {
    arrayMethods.forEach((methodName) => {
        const method = value[methodName];
        const mutator = function (): unknown[] {
            const res = method.apply(this, arguments);
            instance[propName] = [...value];
            instance._forceUpdate();
            return res;
        };
        Object.defineProperty(value, methodName, {
            value: mutator,
            enumerable: false,
            writable: true,
            configurable: true
        });
        Object.defineProperties(value, {
            _reactiveInstance: {
                value: instance,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
    });
}

/**
 * Свойства могут содержать сложные объекты (массивы, объекты, модели). Становясь реактивными,
 * они помечаются специальным образом, чтобы реактивность на свойство была настроена только для самого
 * внешнего контрола. Когда контрол дестроится, нужно снять пометки с таких объектов,
 * чтобы они могли быть зарегистрированы при перерисовке для другого контрола.
 * Необходимо вызывать метод, когда экземпляр дестроится и когда присваивается новый шаблон.
 * @param instance
 */
export function releaseProperties<P, S extends object | void>(instance: Control<P, S>): void {
    const reactiveProps = Object.keys(instance.reactiveValues);
    if (!reactiveProps) {
        return;
    }
    for (let i = 0; i < reactiveProps.length; ++i) {
        const value = instance && instance.reactiveValues[reactiveProps[i]];
        if (value && value._reactiveInstance === instance) {
            value._reactiveInstance = null;
            Object.defineProperty(value, '_version', {
                value: value._version,
                enumerable: true,
                configurable: true,
                writable: true
            });
        }
        releaseValue<P, S>(instance, reactiveProps[i]);
        delete instance.reactiveValues[reactiveProps[i]];
    }
}

function releaseValue<P, S extends object | void>(instance: Control<P, S>, propName: string): void {
    if (!instance.reactiveValues.hasOwnProperty(propName)) {
        return;
    }
    const value = instance.reactiveValues[propName];
    Object.defineProperty(instance, propName, {
        value,
        configurable: true,
        writable: true,
        enumerable: true
    });
}

/**
 * get descriptor of property
 * @param {Object} _obj object having propery
 * @param {String} prop name of property
 * @returns {*} descriptor
 */
function getDescriptor(_obj: object, prop: string): PropertyDescriptor {
    let res = null;
    let obj = _obj;
    while (obj) {
        res = Object.getOwnPropertyDescriptor(obj, prop);
        obj = Object.getPrototypeOf(obj);

        // нашли дескриптор
        if (res) {
            break;
        }
    }
    return res;
}
