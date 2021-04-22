import * as React from 'react';

const formatStringToCamelCase = (str) => {
   const splitted = str.split('-');
   if (splitted.length === 1) return splitted[0];
   return (
      splitted[0] +
      splitted
         .slice(1)
         .map((word) => word[0].toUpperCase() + word.slice(1))
         .join('')
   );
};

const getStyleObjectFromString = (str) => {
   const style = {};
   str.split(';').forEach((el) => {
      // tslint:disable-next-line:typedef
      const [property, value] = el.split(':');
      if (property && value) {
         const formattedProperty = formatStringToCamelCase(property.trim());
         style[formattedProperty] = value.trim();
      }
   });

   return style;
};

export interface WasabyAttributes {
   class?: string;
   style?: string;
   tabindex?: string | number;
   'xml:lang'?: string;
}

/**
 * Конвертирует наши атрибуты в реактовские аналоги.
 * @param attributes
 */
export function convertAttributes<
   T extends HTMLElement,
   P extends React.HTMLAttributes<T>
>(attributes: WasabyAttributes & P): P {
   const convertedAttributes = (attributes as unknown) as P;
   if (attributes.class) {
      convertedAttributes.className = attributes.class;
      delete attributes.class;
   }
   if (attributes.tabindex) {
      convertedAttributes.tabIndex = Number(attributes.tabindex);
      delete attributes.tabindex;
   }
   convertedAttributes.style =
      typeof attributes.style !== 'string'
         ? attributes.style
         : getStyleObjectFromString(attributes.style);

   return convertedAttributes;
}
