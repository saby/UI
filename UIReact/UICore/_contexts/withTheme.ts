import { useContext, ComponentType, createElement, ReactElement } from 'react';
import { Optional } from './Optional';
import { getWasabyContext } from './WasabyContext';
import { Logger } from 'UICommon/Utils';

interface IThemableComponent {
   theme: string;
}

/**
 * Принимает компонент и возвращает обёртку над ним, которая получает тему из контекста и передаёт в опции.
 * Нужно использовать в тех случаях, когда в чистом реактовском классе нужно значение темы.
 * Для функциональных компонентов лучше пользоваться хуком {@link useTheme}.
 * @example
 * <pre>
 *    class Button extends React.Component {
 *       // ...код кнопки
 *    }
 *    export default withTheme(Button);
 * </pre>
 * @param WrappedComponent Компонент, который нужно обернуть.
 * @see useTheme
 */
export function withTheme<T extends IThemableComponent = IThemableComponent>(
   WrappedComponent: ComponentType<T>
): (
   props: Optional<T, keyof IThemableComponent>
) => ReactElement<T & { theme: string }> {
   const displayName =
      WrappedComponent.displayName || WrappedComponent.name || 'Component';

   const ComponentWithTheme = (
      props: Optional<T, keyof IThemableComponent>
   ) => {
      const themeValue = useTheme();

      if (typeof props.theme !== 'undefined' && props.theme !== themeValue) {
         Logger.error(
            `[${displayName}] Значение опции theme переданное в опции не совпадает со значением из контекста (опции: ${props.theme}, контекст: ${themeValue}). Задание опции theme через опцию устарело, используйте контекст.`
         );
      }

      return createElement(WrappedComponent, {
         theme: themeValue,
         ...(props as T)
      });
   };

   ComponentWithTheme.displayName = `withTheme(${displayName})`;

   return ComponentWithTheme;
}

/**
 * Возвращает значение темы из контекста.
 */
export function useTheme(): string {
   return useContext(getWasabyContext()).theme;
}
