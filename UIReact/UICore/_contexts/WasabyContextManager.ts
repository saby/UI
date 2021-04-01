import {
   createElement,
   useMemo,
   PropsWithChildren,
   FunctionComponentElement,
   ProviderProps
} from 'react';
import { useTheme } from './withTheme';
import { useReadonly } from './withReadonly';
import {
   getWasabyContext,
   IWasabyContextValue
} from 'UI/_react/WasabyContext/WasabyContext';

/**
 * Контрол, управляющий контекстом совместимости. Используется для "наследования" опций theme и readOnly.
 * По умолчанию, передаёт значение из контекста вниз, но если передана опция theme или readOnly, то
 * передаётся значение из опций.
 * @param props Значения theme и readOnly, которые должны быть установлены в контекст, и элемент, который должен быть отрисован внутри.
 * @example
 * В данном примере мы получаем тему из хранилища и устанавливаем её в контекст, чтобы дети могли её использовать:
 * <pre>
 *    render(): React.ReactNode {
 *       const theme = getUserTheme();
 *       return (<WasabyContextManager theme={theme} readOnly={readOnly}>
 *          // здесь ваш шаблон
 *       </WasabyContextManager>);
 *    }
 * </pre>
 */
export function WasabyContextManager(
   props: PropsWithChildren<Partial<IWasabyContextValue>>
): FunctionComponentElement<ProviderProps<IWasabyContextValue>> {
   const { Provider } = getWasabyContext();
   const contextReadonly = useReadonly();
   const contextTheme = useTheme();
   const value = useMemo(() => {
      /*
      В контекст кладётся именно объект по такой причине: для поддержки наследуемых опций нам нужно во все старые
      контролы подключить контекст. В классовые контролы контекст мы можем подключить только через contextType,
      а туда можно положить только один контекст.
       */
      return {
         readOnly: props.readOnly ?? contextReadonly,
         theme: props.theme ?? contextTheme
      };
   }, [props.readOnly, props.theme, contextReadonly, contextTheme]);

   /*
   Provider должен создаваться безусловно, даже если опции не переданы или они совпадают со значением из контекста.
   Если мы начнём создавать Provider только в части случаев, то произойдёт следующее: у части контролов появится новый
   родитель, реакт в таком случае удаляет старое дерево и маунтит новое, а это приведёт к тормозам и потере стейта.
    */
   return createElement(Provider, {
      value,
      children: props.children
   });
}
