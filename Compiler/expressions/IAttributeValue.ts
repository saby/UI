/**
 * @description Represents interface for attribute value.
 * @author Крылов М.А.
 */

import { VariableNode } from "./Statement";

/**
 * Интерфейст значения атрибута.
 * @todo Отрефакторить парсеры и перенести интерфейс в определения Wasaby-узлов.
 */
export interface IAttributeValue {
   /**
    * Значение атрибута можеть быть "склейкой" разных узлов - локализация, текст, выражение.
    */
   data: VariableNode[];
   /**
    * Флаг, необходимый для различия опций контрола от атрибутов.
    * @todo Избыточный флаг. Отрефакторить код и избавиться от него.
    */
   property: boolean;
   /**
    * Тип атрибута.
    * @todo Избыточный флаг. Отрефакторить код и избавиться от него.
    */
   type: string;
}