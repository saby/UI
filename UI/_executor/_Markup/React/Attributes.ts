const formatStringToCamelCase = str => {
    const splitted = str.split('-');
    if (splitted.length === 1) return splitted[0];
    return (
        splitted[0] +
        splitted
            .slice(1)
            .map(word => word[0].toUpperCase() + word.slice(1))
            .join('')
    );
};

const getStyleObjectFromString = str => {
    const style = {};
    str.split(';').forEach(el => {
        // tslint:disable-next-line:typedef
        const [property, value] = el.split(':');
        if (!property) return;

        const formattedProperty = formatStringToCamelCase(property.trim());
        style[formattedProperty] = value.trim();
    });

    return style;
};

interface WasabyAttributes {
    class?: string;
    style?: string;
}
interface ReactAttributes {
    className?: string;
    style?: object;
}

export function convertAttributes(attributes: WasabyAttributes): ReactAttributes {
    const convertedAttributes: ReactAttributes = attributes as unknown as ReactAttributes;
    convertedAttributes.className = attributes.class;
    delete attributes.class;
    convertedAttributes.style = typeof attributes.style !== 'string' ?
        attributes.style :
        getStyleObjectFromString(attributes.style);

    return convertedAttributes;
}
