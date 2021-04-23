import {useState, Component} from 'react';
import {IVersionable} from 'Types/entity';

/**
 * Метод запуска отслеживания изменений версионируемых объектов
 * @param instance - Экземпляр компонента который необходимо обновлять при изменении
 * @param props - Свойства класса, за которыми необходимо следить
 */
export function makeObservable<T extends Component>(instance: T, props: (keyof T)[]): void {
    props.forEach((prop) => {
        let value: IVersionable = instance[prop] as unknown as IVersionable;
        Object.defineProperty(instance, prop, {
            set(newVal: IVersionable): void {
                value = newVal;
                observeVersion<T>(instance, value);
                instance.setState({});
            },
            get(): IVersionable {
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
export function useMakeObservable(props: IVersionable[]): void {
    const [_$reactive, _$setReactive] = useState(0);
    props.forEach((prop) => {
        if (prop.getVersion()) {
            let currentValue = prop.getVersion();
            Object.defineProperty(prop, '_version', {
                set(newVal: number): void {
                    currentValue = newVal;
                    _$setReactive(_$reactive + 1);
                },
                get(): number {
                    return currentValue;
                }
            });
        }
    });
}

function observeVersion<T>(instance: Component, value: IVersionable): void {
    let currentValue = value.getVersion();
    Object.defineProperty(value, '_version', {
        set(val: number): void {
            currentValue = val;
            instance.setState({});
        },
        get(): number {
            return currentValue;
        }
    });
}
