import { ElementType, ReactElement } from 'react';

export default function RenderPropWithoutAdditionalProps(props: {
    content: () => ElementType;
}): ReactElement {
    return <div>{props.content()}</div>;
}
