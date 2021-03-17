/// <amd-module name="UI/_base/HTML/_meta/JsonML" />
import { ITagDescription, JML, FullJML } from 'UI/_base/HTML/_meta/interface';
/**
 * Конвертация из JsonML в ITagDescription
 * https://wi.sbis.ru/doc/platform/developmentapl/service-development/service-contract/logic/json-markup-language/
 * @param param0
 */
export function fromJML([tagName, attrs, children]: JML): ITagDescription {
   if (!attrs || attrs.constructor !== Object) {
      // Прелесть JsonML в том, что attrs может не быть, а вторым аргументом будут children
      return fromFullJML([tagName, {}, attrs as JML]);
   }
   return fromFullJML([tagName, attrs as Record<string, string>, children]);
}
/** JsonML с аттрибутами */
function fromFullJML([tagName, attrs, children]: FullJML): ITagDescription {
   if (!children) {
      return { tagName, attrs } as ITagDescription;
   }
   // children могут быть JML, а могут быть строкой
   if (typeof children === 'string') {
      return { tagName, attrs, children };
   }
   return { tagName, attrs, children: fromJML(children) } as ITagDescription;
}
