import {Control} from './Compatible';

interface IReactiveProp {
    _$reactived: Control;
    _arrayVersion?: number;
}

const arrayMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];

/**
 * Подписываемся на изменения шаблона и полей у instance
 * @param {Control<P, S>} inst
 * @param template
 */
export function reactiveObserve(inst: Control, template: any): void {
    if (!inst.reactiveValues) {
        inst.reactiveValues = {};
    }
    Object.defineProperty(inst, '_template', {
        enumerable: true,
        configurable: true,
        get: () => {
            return template;
        },
        set: (newTemplateFunction) => {
            if (newTemplateFunction !== template && newTemplateFunction && newTemplateFunction.reactiveProps) {
                releaseProperties(inst);
                reactiveObserve(inst, newTemplateFunction);
                inst._forceUpdate();
            }
        }
    });
    const templateProps = template.reactiveProps;
    if (templateProps) {
        templateProps.forEach((prop) => {
            const desc = getDescriptor(inst, prop);
            inst.reactiveValues[prop] = inst[prop];
            observeVersion(inst, prop);
            observeArray(inst, prop);
            Object.defineProperty(inst, prop, {
                enumerable: true,
                configurable: true,
                get: function reactiveGetter(): unknown {
                    if (desc && desc.get) {
                        return desc.get.apply(this, arguments);
                    }
                    return inst.reactiveValues[prop];
                },
                set: function reactiveSetter(value: unknown): void {
                    // @ts-ignore
                    if (inst.reactiveValues[prop] !== value  && inst._reactiveStart) {
                        inst.reactiveValues[prop] = value;
                        if (Array.isArray(value)) {
                            observeArray(inst, prop);
                        }
                        inst._forceUpdate();
                    }
                }
            });
        });
    }
}

/**
 * Следим за изменениями в версионируемых объектах
 * @param {Control} inst
 * @param {string} prop
 */
function observeVersion(inst: Control, prop: string): void {
    const value = inst[prop];
    if (value && typeof value === 'object' && typeof value._version === 'number' && needToBeReactive(value)) {
        let version = value._version;
        Object.defineProperty(value, '_version', {
            enumerable: true,
            configurable: true,
            get: function reactiveGetter(): number {
                return version;
            },
            set: function reactiveSetter(newVal: unknown): void {
                // @ts-ignore
                if (version !== newVal && inst._reactiveStart) {
                    inst._forceUpdate();
                    version = newVal;
                }
            }
        });
        value._$reactived = inst;
    }
}

/**
 * Оборачиваем методы массива для обновления контрола при изменении массива
 * @param {Control} inst
 * @param {string} prop
 */
function observeArray(inst: Control, prop: string): void {
    const value: IReactiveProp = inst[prop];
    if (value && Array.isArray(value) && needToBeReactive(value)) {
        arrayMethods.forEach((methodName) => {
            const method = value[methodName];
            const mutator = function(): unknown {
                const res = method.apply(this, arguments);
                this._arrayVersion++;
                inst._forceUpdate();
                return res;
            };
            Object.defineProperty(value, methodName, {
                value: mutator,
                enumerable: false,
                writable: true,
                configurable: true
            });
        });
        Object.defineProperties(value, {
            _arrayVersion: {
                value: 0,
                enumerable: true,
                writable: true,
                configurable: true
            },
            getArrayVersion: {
                value: () => {
                    return value._arrayVersion;
                },
                enumerable: false,
                writable: false,
                configurable: true
            },
            _$reactived: {
                value: inst,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
    }
}

function getDescriptor(_obj: object, prop: string): PropertyDescriptor {
    let descriptor = null;
    let obj = _obj;
    while (obj) {
        descriptor = Object.getOwnPropertyDescriptor(obj, prop);
        obj = Object.getPrototypeOf(obj);

        if (descriptor) {
            break;
        }
    }
    return descriptor;
}

/**
 * Необходимо звать перерисовку только самого верхнего контрола у которого данное свойство реактивно, для этого
 * на свойстве добавляется поле _$reactived которое хранит ссылку на instance
 * @param {IReactiveProp} value
 * @returns {boolean}
 */
function needToBeReactive(value: IReactiveProp): boolean {
    return !value._$reactived;
}

/**
 * Свойства могут содержать сложные объекты (массивы, объекты, модели). Становясь реактивными,
 * они помечаются специальным образом, чтобы реактивность на свойство была настроена только для самого
 * внешнего контрола. Когда контрол дестроится, нужно снять пометки с таких объектов,
 * чтобы они могли быть зарегистрированы при перерисовке для другого контрола.
 * Необходимо вызывать метод, когда экземпляр дестроится и когда присваивается новый шаблон.
 * @param {Control} inst
 */
export function releaseProperties(inst: Control<any, any>): void {
    const reactiveValues = inst.reactiveValues;
    if (reactiveValues) {
        const reactiveKeys = Object.keys(reactiveValues);
        for (let i = 0; i < reactiveKeys.length; ++i) {
            releaseProperty(inst, reactiveKeys[i]);
        }
    }
}

function releaseProperty(inst: Control, prop: string, fromReactiveSetter?: Function): void {
    releaseVersion(inst, prop);
    releaseArray(inst, prop);
    releaseValue(inst, prop, fromReactiveSetter);
    delete inst.reactiveValues[prop];
}

function releaseVersion(inst: Control, prop: string): void {
    const value = inst && inst.reactiveValues[prop];
    if (value && value._$reactived === inst) {
        const version = value._version;
        if (typeof version !== 'undefined') {
            value._$reactived = null;
            Object.defineProperty(value, '_version', {
                value: version,
                enumerable: true,
                configurable: true,
                writable: true
            });
        }
    }
}

function releaseArray(inst: Control, prop: string): void {
    const value: IReactiveProp = inst && inst.reactiveValues[prop];
    if (value && value._$reactived === inst) {
        if (Array.isArray(value)) {
            value._$reactived = null;
            for (let i = 0; i < arrayMethods.length; i++) {
                Object.defineProperty(value, arrayMethods[i], {
                    value: Array.prototype[arrayMethods[i]],
                    configurable: true,
                    writable: true,
                    enumerable: false
                });
            }
        }
    }
}

function releaseValue(inst: Control, prop: string, fromReactiveSetter: Function): void {
    if (fromReactiveSetter) {
        return;
    }
    if (inst.reactiveValues.hasOwnProperty(prop)) {
        const value = inst.reactiveValues[prop];
        Object.defineProperty(inst, prop, {
            value,
            configurable: true,
            writable: true,
            enumerable: true
        });
    }
}
