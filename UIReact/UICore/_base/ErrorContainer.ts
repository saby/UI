import { Component, createElement, ReactElement } from 'react';
import { getResourceUrl } from 'UICommon/Utils';
import { TErrBoundaryOptions } from 'UICore/_base/interfaces';

/**
 * ErrorContainer, возвращает всегда один и тот же дефолтный шаблон.
 */
export class ErrorContainer extends Component<TErrBoundaryOptions>{
    render(): ReactElement {
        return createElement('div',{
            key: 'e1',
            style: {
                border: '1px solid red',
                padding: '50px',
                maxWidth: '30%',
                margin: '0 auto',
                textAlign: 'center'
            }
        }, [
            createElement('img', { key: 'e11',
                style: {
                    maxWidth: '100%',
                    maxHeight: '200px',
                    marginBottom: '20px'
                },
                src: getResourceUrl(
                    `/cdn/Maintenance/1.1.0/img/NOT_FOUND_${this.props?.theme}.svg`)
            }),
            createElement('div', {key: 'e12'}, this.props.errorConfig._errorMessage)
        ]);
    }
}
