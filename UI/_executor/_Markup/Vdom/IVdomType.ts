/// <amd-module name="UI/_executor/_Markup/Vdom/IGeneratorType" />
/* tslint:disable */

import {
   IGeneratorInternalProperties,
   IGeneratorAttrsContext,
   IGeneratorInheritOptions,
   TAttributes,
   TEvents
} from '../IGeneratorType';
import { VNode } from 'Inferno/third-party/index';


export type IGeneratorVNode = VNode;

/**
 * @author Тэн В.А.
 */
// Интерфейс ноды контрола
interface IGeneratorControlNode {
   compound: boolean;
   invisible: boolean;
   controlClass: Function;
   controlProperties: TProps;
   controlInternalProperties: IGeneratorInternalProperties;
   controlAttributes: TAttributes;
   controlEvents: TEvents;
   key: string;
   controlNodeIdx: number;
   context: IGeneratorAttrsContext;
   inheritOptions: IGeneratorInheritOptions;
   flags: number;
   events: Event;
}

// Тип для генераторов Vdom-нод
export type GeneratorNode = IGeneratorVNode | IGeneratorControlNode;

// Типы сопоставления для случаем когда однозначно описать тип не можем
type TProps = Record<string, unknown>;
