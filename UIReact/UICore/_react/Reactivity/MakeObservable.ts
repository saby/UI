import {useState, Component} from "react";
import {IVersionable} from "Types/entity";

/**
 * Метод запуска отслеживания изменений версионируемых объектов
 * @param instance - Экземпляр компонента который необходимо обновлять при изменении
 * @param props - Свойства класса, за которыми необходимо следить
 */
export function makeObservable<T extends Component>(instance: T, props: Array<keyof T>) {
    props.forEach((prop) => {
        let value = instance[prop];
        Object.defineProperty(instance, prop, {
            set(newVal) {
                value = newVal;
                observeVersion<T>(instance, value);
                instance.setState({});
            },
            get() {
                return value;
            }
        });
        observeVersion<T>(instance, value);
    });
}

/**
 * Hook для функциональных компонентов, обновляет компонент при изменении версионируемого объекта
 * @param {IVersionable[]} props - массив объектов за которыми необходимо следить
 */
export function useMakeObservable(props: IVersionable[]) {
    const [_$reactive, _$setReactive] = useState(0);
    props.forEach((prop) => {
        if (prop?.['_version']) {
            let currentValue = prop['_version'];
            Object.defineProperty(prop, '_version', {
                set(newVal) {
                    currentValue = newVal;
                    _$setReactive(_$reactive + 1);
                },
                get() {
                    return currentValue;
                }
            });
        }
    });
}

function observeVersion<T>(instance: Component, value: T[keyof T]) {
    let currentValue = value['_version'];
    Object.defineProperty(value, '_version', {
        set(val) {
            currentValue = val;
            instance.setState({});
        },
        get() {
            return currentValue;
        }
    });
}
