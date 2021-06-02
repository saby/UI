import { Control } from 'UICore/Base';
import { TemplateFunction } from 'UICommon/Base';
import * as React from 'react';
import { IWasabyContextValue } from 'UICore/Contexts';
import {
    CommonUtils as Common,
    Attr,
    IGeneratorNameObject, ITplFunction
} from 'UICommon/Executor';
import { IWasabyEvent } from 'UICommon/Events';

/*
    FIXME: как я понимаю, в этом объекте могут быть HTMl-атрибуты+какие-то наши поля.
 */
export interface IGeneratorAttrs {
    attributes: Attr.IAttributes;
    events: Record<string, IWasabyEvent[]>;
}

export interface IControlConfig {
    depsLocal: Common.Deps<typeof Control, TemplateFunction>;
    viewController: Control;
    includedTemplates: Common.IncludedTemplates<TemplateFunction>;
    compositeAttributes?: Attr.IAttributes;
    data: any;
    mergeType: 'attribute' | 'context';
    attr: IGeneratorAttrs;
}

export type TemplateResult = React.FunctionComponentElement<
    Partial<IWasabyContextValue> & { children?: React.ReactNode }
    >;

export type AttrToDecorate = {
    attributes: Record<string, unknown>;
    events: Record<string, IWasabyEvent[]>
};

/**
 * Либо сам шаблон/конструктор контрола, либо строка, по которой его можно получить.
 */
export type TemplateOrigin =
    | Common.IDefaultExport<typeof Control>
    | TemplateFunction
    | ITplFunction<TemplateFunction>
    | IGeneratorNameObject
    | typeof Control
    | string
    | Function
    | Common.ITemplateArray<TemplateFunction>;
