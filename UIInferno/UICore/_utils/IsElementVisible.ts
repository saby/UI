/**
 * Модуль, в котором описана функция <b>isElementVisible(elem)</b>.
 *
 * Проверить видимость элемента
 * Метод выполняет для переданного элемента две проверки:
 * <ul>
 *    <li>Элемент находится в DOM (у него есть родитель 'html').</li>
 *    <li>У него нет невидимых родителей ('.ws-hidden').</li>
 * </ul>
 *
 * <h2>Параметры функции</h2>
 * <ul>
 *     <li><b>elem</b> {jQuery} - проверяемый на видимость элемент.</li>
 *     <li><b>isCheckVisibilityHidden</b> {Boolean} - влияет ли стиль visibility: hidden на невидимость при проверке.</li>
 * </ul>
 *
 * <h2>Возвращает</h2>
 * {Boolean} Видимость элемента.
 *
 * @class UI/_utils/IsElementVisible
 * @public
 * @author Шипин А.А.
 */

var invisibleReWithoutVisibility = /\bws-hidden\b/;

// ws-compatible-popup-hidden обсусловлен тем, что в слое совместимости окон нужно разделить скрытие
// контрола пользователем (setVisibility: false) и скрытие контрола слоем совместимости.
// Убрать после того, как все старые страницы переведут на application.
var invisibleReWithVisibility = /\b(ws-hidden|ws-invisible|ws-compatible-popup-hidden)\b/;

export default function isElementVisible(elem, isCheckVisibilityHidden: boolean = false) {
   var classes, doc = document, result = true;

   // если на элементе есть стиль visibility: hidden - такой элемент тоже не может сфокусироваться
   // делаю еще проверку на visibility: hidden в isElementVisible, чтобы такие элементы считались невидимыми при определении в старой системе фокусов.
   var invisibleRe = isCheckVisibilityHidden ? invisibleReWithVisibility : invisibleReWithoutVisibility;

   elem = (elem && elem.jquery) ? elem[0] : elem;

   // todo это костыльное решение, потому что иногда vdom-компоненты отдают сюда не элемент, а свою ноду
   // например падает тест http://tsd-mitinau:1000/IntFieldLink4.html если открывать панель нижнего поля связи
   if (!(elem instanceof HTMLElement) && !(elem instanceof SVGElement)) {
      return false;
   }

   // если это vdom-контрол с совместимостью, нужно учесть результат метода isVisible
   // @ts-ignore
   if (elem.wsControl) {
      // @ts-ignore
      if (elem.wsControl.isDestroyed()) {
         return false;
      }
      const Control = requirejs('UICore/Base').Control;
      // @ts-ignore
      if (elem.wsControl instanceof Control) {
         // @ts-ignore
         result = result && (!elem.wsControl.isVisible || elem.wsControl.isVisible());
      }
   }

   // нужно проверить что контрол есть в DOM и что он видим (на пути нет классов скрывающих его)
   while (elem && elem.getAttribute) {
      classes = elem.getAttribute('class');
      if (classes && invisibleRe.test(classes)) {
         break;
      }
      const computedStyle = window.getComputedStyle(elem);
      if (computedStyle.visibility &&
            (computedStyle.visibility === 'hidden' || computedStyle.visibility === 'invisible')) {
         break;
      }
      if (computedStyle.display && computedStyle.display === 'none') {
         break;
      }
      elem = elem.parentNode;
   }
   result = result && elem === doc;

   return result;
};
