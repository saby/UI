import { Control } from 'UICore/Base';
import { TemplateFunction } from 'UICommon/Base';
import * as React from 'react';
import { IWasabyContextValue } from 'UICore/Contexts';
import {
    CommonUtils as Common,
    Attr,
    IGeneratorNameObject, ITplFunction
} from 'UICommon/Executor';

/*
FIXME: как я понимаю, в этом объекте могут быть HTMl-атрибуты+какие-то наши поля.
Из наших полей пока используется только internal, и даже от него вроде можно избавиться.
Надо разобраться и заменить на нормальный тип.
 */
export interface IGeneratorAttrs {
    attributes: Attr.IAttributes;
    internal: {
        // FIXME: само поле есть всегда, но мне кажется, что для корня там ничего не будет.
        // Если так, то просто убрать FIXME. Если не так, то убрать ? у типа.
        // Ну и вообще можно см. https://online.sbis.ru/opendoc.html?guid=f354360c-5899-4f74-bf54-a06e526621eb
        parent?: Control;
    };
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
    | ITplFunction<TemplateFunction>
    | IGeneratorNameObject
    | typeof Control
    | string
    | Function
    | Common.ITemplateArray<TemplateFunction>;
