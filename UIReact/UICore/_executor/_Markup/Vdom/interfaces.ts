import Control, { TemplateFunction } from 'UICore/Base';
import {
    CommonUtils as Common,
    _IGeneratorType as IGT
} from 'UICore/Executor';
import * as React from 'react';
import { IWasabyContextValue } from 'UICore/Contexts';

/*
FIXME: как я понимаю, в этом объекте могут быть HTMl-атрибуты+какие-то наши поля.
Из наших полей пока используется только internal, и даже от него вроде можно избавиться.
Надо разобраться и заменить на нормальный тип.
 */
export interface IGeneratorAttrs {
    attributes: Record<string, unknown>;
    internal?: {
        parent: Control;
    };
}

export interface IControlConfig {
    depsLocal: Common.Deps<typeof Control, TemplateFunction>;
    viewController: Control;
    includedTemplates: Common.IncludedTemplates<TemplateFunction>;
}

export type TemplateResult = React.FunctionComponentElement<
    Partial<IWasabyContextValue> & { children?: React.ReactNode }
    >;

export type AttrToDecorate = Record<string, {
    attributes: Record<string, unknown>
}>;

export interface IWasabyEvent {
    args: unknown[];
    context: Function;
    handler: Function;
    isControl: boolean;
    value: string;
    viewController: Control;
}

/**
 * Либо сам шаблон/конструктор контрола, либо строка, по которой его можно получить.
 */
export type TemplateOrigin =
    | Common.IDefaultExport<typeof Control>
    | TemplateFunction
    | IGT.IGeneratorNameObject
    | typeof Control
    | string
    | Function
    | Common.ITemplateArray<TemplateFunction>;
