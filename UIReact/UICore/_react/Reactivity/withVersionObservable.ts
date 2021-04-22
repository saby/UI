import {ComponentType, createElement} from 'react';
import {IVersionable} from 'Types/entity';

/**
 * HOC для обновления компонента при изменении версии в опции на вход
 * @param WrappedComponent - Компонент который необходимо обновлять при изменении версии
 * @param customObserveProps - Массив имен свойств, за которыми необходимо следить, если их не передать
 * отслеживаться будут все версионируемые свойства
 */
export function withVersionObservable<T>(WrappedComponent: ComponentType<T>,
                                         customObserveProps?: (keyof T)[]): ComponentType<T> {
    const displayName =
        WrappedComponent.displayName || WrappedComponent.name || 'Component';

    const ComponentWithVersionObserver = (props: T) => {
        const versionProps: IVersionable[] = [];
        const observeProps = customObserveProps || Object.keys(props);
        observeProps.forEach((prop) => {
            if (props?.[prop]._version) {
                versionProps.push(props?.[prop]);
            }
        });
        return createElement(WrappedComponent, {
            // Навешиваем свойство с суммой версий свойств, для того, чтобы обновлялись Pure и memo компоненты
            'data-$$version': getReactiveVersionsProp(versionProps),
            ...props as T
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
