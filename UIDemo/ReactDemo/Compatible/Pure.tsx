import {ReactElement} from 'react';
import * as CoreCompound from 'Core/CompoundContainer';

const compoundOptions: object = {
    text: 'I"m compound'
};

export default function Pure(): ReactElement {
    return <div>
        <h2>Hi</h2>
        <CoreCompound component="UIDemo/ReactDemo/Compatible/WS3Component"
                      componentOptions={compoundOptions}/>
    </div>;
}
