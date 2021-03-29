import {Control} from 'UI/_react/Control/WasabyOverReact';
import * as Common from 'UI/_executor/_Utils/Common';
import {TemplateFunction} from 'UI/_react/Control/interfaces';
import * as React from 'react';
import {IWasabyContextValue} from 'UI/_react/WasabyContext/WasabyContext';
import {IGeneratorNameObject} from "UI/_executor/_Markup/IGeneratorType";

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
    data: any;
}

export type TemplateResult = React.FunctionComponentElement<
    Partial<IWasabyContextValue> & { children?: React.ReactNode }
    >;

/**
 * Либо сам шаблон/конструктор контрола, либо строка, по которой его можно получить.
 */
export type TemplateOrigin =
    | Common.IDefaultExport<typeof Control>
    | TemplateFunction
    | IGeneratorNameObject
    | typeof Control
    | string
    | Function
    | Common.ITemplateArray<TemplateFunction>;
