import { IControlOptions } from 'UICommon/Base';
import * as template from 'wml!UICore/_base/WasabyPortal';
import { createPortal } from 'react-dom';
import { ReactPortal } from 'react';

interface IWasabyPortalOptions extends IControlOptions {
    portalContainer: HTMLElement;
}

export default function WasabyPortal(props: IWasabyPortalOptions): string | ReactPortal {
    // TODO После решения задачи про контентную опцию в виде функции можно будет попробовать обойтись без шаблона.
    const out = template.apply(this, arguments);
    const portalContainer: HTMLElement = props.portalContainer;
    if (!portalContainer) {
        return out;
    }
    return createPortal(out, portalContainer);
}
