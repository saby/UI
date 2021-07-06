import { FunctionComponentElement, ReactElement } from 'react';

export default function RenderPropWithAdditionalProps(props: {
    content: FunctionComponentElement<{
        testProp: string;
    }>;
}): ReactElement {
    const Content = props.content;
    return <div><Content testProp="456" /></div>;
}
