import { createElement, useContext, ReactElement } from 'react';
import { Optional } from './Optional';
import { getWasabyContext } from './WasabyContext';
import { Logger } from 'UICommon/Utils';

interface IReadOnlyComponent {
   readOnly: boolean;
}

/**
 * Принимает компонент и возвращает обёртку над ним, которая получает readOnly из контекста и передаёт в опции.
 * Нужно использовать в тех случаях, когда в чистом реактовском классе нужно значение readOnly.
 * Для функциональных компонентов лучше пользоваться хуком {@link useReadonly}.
 * @example
 * <pre>
 *    class Button extends React.Component {
 *       // ...код кнопки
 *    }
 *    export default withReadonly(Button);
 * </pre>
 * @param WrappedComponent Компонент, который нужно обернуть.
 * @see useReadonly
 */
export function withReadonly<T extends IReadOnlyComponent = IReadOnlyComponent>(
   WrappedComponent: React.ComponentType<T>
): (
   props: Optional<T, keyof IReadOnlyComponent>
) => ReactElement<T & { readOnly: boolean }> {
   const displayName =
      WrappedComponent.displayName || WrappedComponent.name || 'Component';

   const ComponentWithReadOnly = (
      props: Optional<T, keyof IReadOnlyComponent>
   ) => {
      const readOnlyValue = useReadonly();

      if (
         typeof props.readOnly !== 'undefined' &&
         props.readOnly !== readOnlyValue
      ) {
         Logger.error(
            `[${displayName}] Значение опции readOnly переданное в опции не совпадает со значением из контекста (опции: ${props.readOnly}, контекст: ${readOnlyValue}). Задание опции readOnly через опцию устарело, используйте контекст.`
         );
      }

      return createElement(WrappedComponent, {
         readOnly: readOnlyValue,
         ...(props as T)
      });
   };

   ComponentWithReadOnly.displayName = `withReadOnly(${displayName})`;

   return ComponentWithReadOnly;
}

export function useReadonly(): boolean {
   return useContext(getWasabyContext()).readOnly;
}
