/// <amd-module name="UI/_executor/_Markup/Vdom/IGeneratorType" />
/* tslint:disable */

import {
    IGeneratorInternalProperties,
    IGeneratorAttrsContext,
    IGeneratorInheritOptions,
    TAttributes,
    TEvents,
    TProps
} from '../IGeneratorType';
import { VNode } from 'Inferno/third-party/index';

export type IGeneratorVNode = VNode;

/**
 * @author Тэн В.А.
 */
// Интерфейс ноды контрола
export interface IGeneratorControlNode {
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
    length?: number;
}

// Тип для генераторов Vdom-нод
export type TGeneratorNode = IGeneratorVNode & IGeneratorControlNode;
