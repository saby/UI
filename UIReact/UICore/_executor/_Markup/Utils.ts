import {
    Attr,
    VoidTags as voidElements,
    TAttributes,
    IAttributes
} from 'UICommon/Executor';
import {CreateChildrenRef} from './Vdom/Refs/CreateChildrenRef';
import {CreateEventRef} from './Vdom/Refs/CreateEventRef';
import {convertAttributes, WasabyAttributes} from './Attributes';
import { ArrayUtils } from 'UICommon/Utils';

import { IWasabyEvent } from 'UICommon/Events';
import {AttrToDecorate} from './interfaces';
import { Control } from 'UICore/Base';
import { ChainOfRef, CreateOriginRef } from 'UICore/Ref';

import * as React from "react";

/**
 * @author Тэн В.А.
 */

export function createTagDefaultText(tag, attrs, children, attrToDecorate?, defCollection?): string {
    if (!attrToDecorate) {
        attrToDecorate = {};
    }
    if (!attrs) {
        attrs = {attributes: {}};
    }

    const mergedAttrs = Attr.processMergeAttributes(
        attrToDecorate.attributes as IAttributes,
        attrs.attributes as IAttributes
    );

    Object.keys(mergedAttrs).forEach((attrName) => {
        if (attrName.indexOf('top:') === 0) {
            const newAttrName = attrName.replace('top:', '');
            mergedAttrs[newAttrName] = mergedAttrs[newAttrName] || mergedAttrs[attrName];
            delete mergedAttrs[attrName];
        }
    });

    const mergedAttrsStr = mergedAttrs
        ? decorateAttrs(mergedAttrs, {})
        : '';
    // tslint:disable-next-line:no-bitwise
    if (~voidElements.indexOf(tag)) {
        return '<' + tag + mergedAttrsStr + ' />';
    }
    return '<' + tag + mergedAttrsStr + '>' + joinElementsDefault(children) + '</' + tag + '>';
}

export function createTagDefaultVdom<T extends HTMLElement, P extends React.HTMLAttributes<T>>(
    tagName: keyof React.ReactHTML,
    attrs: {
        attributes: P & WasabyAttributes;
        events: Record<string, IWasabyEvent[]>
    },
    children: React.ReactNode[] & {
        for: boolean
    },
    attrToDecorate: AttrToDecorate,
    __: unknown,
    control?: Control
): React.DetailedReactHTMLElement<P, T> {
    if (!attrToDecorate) {
        attrToDecorate = {attributes: {}, events: {}};
    }
    /* если события объявляется на контроле, и корневом элементе шаблона, то мы должны смержить события,
     * без этого события объявленные на контроле будут потеряны
     */
    const extractedEvents = { ...attrToDecorate.events, ...attrs.events };
    if (Object.keys(extractedEvents).length) {
        let eventsMeta;
        if (attrToDecorate.events && attrToDecorate.events.meta && Object.keys(attrToDecorate.events.meta).length) {
            eventsMeta = {...attrToDecorate.events.meta};
        }
        if (attrs.events && attrs.events.meta && Object.keys(attrs.events.meta).length) {
            eventsMeta = {...attrs.events.meta};
        }
        Object.defineProperty(extractedEvents, 'meta', {
            configurable: true,
            value: eventsMeta
        });
    }
    const eventsObject = {
        events: extractedEvents
    };
    /**
     * Объединяет атрибуты, указанные на элементе, с атрибутами, которые пришли сверху
     */
    const mergedAttrs = Attr.mergeAttrs(attrToDecorate.attributes, attrs.attributes);
    Object.keys(mergedAttrs).forEach((attrName) => {
        if (!mergedAttrs[attrName]) {
            delete mergedAttrs[attrName];
        }
    });
    const name = mergedAttrs.name;
    const originRef = attrs.attributes.ref;
    const chainOfRef = new ChainOfRef();
    const createChildrenRef = new CreateChildrenRef(control, name);
    const createEventRef = new CreateEventRef(tagName, eventsObject);
    chainOfRef.add(createChildrenRef);
    chainOfRef.add(createEventRef);
    if (originRef){
        chainOfRef.add(new CreateOriginRef(originRef));
    }

    const convertedAttributes = convertAttributes(mergedAttrs);

    /* не добавляем extractedEvents в новые пропсы на теге, т.к. реакт будет выводить ошибку о неизвестном свойстве
        https://online.sbis.ru/opendoc.html?guid=d90ec578-f610-4d93-acdd-656095591bc1
    */
    const newProps = {
        ...convertedAttributes,
        ref: chainOfRef.execute()
    };

    // Разворачиваем массив с детьми, так как в противном случае react считает, что мы отрисовываем список
    const flatChildren = ArrayUtils.flatten(children, true);
    if (flatChildren.for) {
        // если дети получены циклом - нужно вставлять их массивом, чтобы учитывались ключи
        return React.createElement<P, T>(tagName, newProps, flatChildren);
    }
    return React.createElement<P, T>(tagName, newProps, ...flatChildren);
}

export function joinElementsDefault(elements: string[]): string {
    if (Array.isArray(elements)) {
        let res = '';
        elements.forEach((element) => {
            if (Array.isArray(element)) {
                element = joinElementsDefault(element);
            }
            res += (element || '');
        });

        return res;
    } else {
        throw new Error('joinElements: elements is not array');
    }
}

function decorateAttrs(attr1: TAttributes, attr2: TAttributes): string {
    function wrapUndef(value: string): string {
        if (value === undefined || value === null) {
            return '';
        } else {
            return value;
        }
    }

    const attrToStr = (attrs: string[]): string => {
        let str = '';
        for (const attr in attrs) {
            if (attrs.hasOwnProperty(attr)) {
                str += (wrapUndef(attrs[attr]) !== '' ? ' ' + (attr + '="' + attrs[attr] + '"') : '');
            }
        }
        return str;
    };
    return attrToStr(Attr.joinAttrs(attr1, attr2));
}
