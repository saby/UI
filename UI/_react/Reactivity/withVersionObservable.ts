import {ComponentType, createElement} from "react";

/**
 * HOC для обновления компонента при изменении версии в опции на вход
 * @param WrappedComponent - Компонент который необходимо обновлять при изменении версии
 * @param props - Массив имен свойств, за которыми  необходимо следить
 */
export function withVersionObservable<T>(WrappedComponent: ComponentType<T>, props?: Array<keyof T>): ComponentType<T> {
    const displayName =
        WrappedComponent.displayName || WrappedComponent.name || 'Component';

    const ComponentWithVersionObserver = (inputProps: T) => {
        let versionProp = 0;
        const requiredProps = props || Object.keys(inputProps);
        requiredProps.forEach((prop) => {
            if (inputProps?.[prop]?.['_version']) {
                versionProp += inputProps[prop]['_version'];
            }
        });
        return createElement(WrappedComponent, {
            _$versionProp: versionProp,
            ...inputProps as T
        });
    };

    ComponentWithVersionObserver.displayName = `withVersionObservable(${displayName})`;

    return ComponentWithVersionObserver;
}
