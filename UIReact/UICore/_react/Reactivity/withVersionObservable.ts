import {ComponentType, createElement} from "react";
import {IVersionable} from "Types/entity";

/**
 * HOC для обновления компонента при изменении версии в опции на вход
 * @param WrappedComponent - Компонент который необходимо обновлять при изменении версии
 * @param props - Массив имен свойств, за которыми  необходимо следить
 */
export function withVersionObservable<T>(WrappedComponent: ComponentType<T>, props?: Array<keyof T>): ComponentType<T> {
    const displayName =
        WrappedComponent.displayName || WrappedComponent.name || 'Component';

    const ComponentWithVersionObserver = (inputProps: T) => {
        let versionProps: IVersionable[] = [];
        const requiredProps = props || Object.keys(inputProps);
        requiredProps.forEach((prop) => {
            if (inputProps?.[prop]?.['_version']) {
                versionProps.push(inputProps?.[prop]);
            }
        });
        return createElement(WrappedComponent, {
            'data-$$version': getReactiveVersionsProp(versionProps),
            ...inputProps as T
        });
    };

    ComponentWithVersionObserver.displayName = `withVersionObservable(${displayName})`;

    return ComponentWithVersionObserver;
}

/**
 * Генерирует свойство версий по массиву версионируеммых объектов
 * @param {IVersionable[]} props - список объектов, при изменении которых необходимо изменять свойство
 * @return number
 */
export function getReactiveVersionsProp(props: IVersionable[]): number {
    return props.reduce((prev, next) => prev + next.getVersion(), 0);
}
