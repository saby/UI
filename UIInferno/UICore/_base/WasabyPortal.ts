import Control from './Control';
import { IControlOptions, TemplateFunction } from 'UICommon/Base';
import * as template from 'wml!UICore/_base/WasabyPortal';
import { createPortal, VNode } from 'Inferno/third-party/index';

interface IWasabyPortalOptions extends IControlOptions {
    portalContainer: HTMLElement;
}

const wasabyPortalProps = {};

function fixedWasabyPortalTemplate(...args: unknown[]): string | VNode[] {
    const out = template.apply(this, args);

    const portalContainer: HTMLElement = this._options.portalContainer;
    if (!portalContainer) {
        return out;
    }
    const portalVNode = createPortal(out, portalContainer);
    portalVNode.children = out;
    portalVNode.hprops = wasabyPortalProps;
    return [portalVNode];
}

function bindWasabyPortalTemplate(self: Control): TemplateFunction {
    const bindedTemplate: TemplateFunction = fixedWasabyPortalTemplate.bind(self);
    bindedTemplate.stable = true;
    bindedTemplate.isWasabyTemplate = true;
    return bindedTemplate;
}

export default class WasabyPortal extends Control<IWasabyPortalOptions> {
    constructor(cfg: IWasabyPortalOptions, context: unknown) {
        super(cfg, context);
        this._template = bindWasabyPortalTemplate(this);
    }
}
