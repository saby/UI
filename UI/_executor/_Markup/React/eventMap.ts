const eventMap = {
    'on:click': 'onClick',
    'on:change': 'onChange'
};
function repairEventName(eventName: string): string {
    return eventMap[eventName] || eventName;
}
export {repairEventName};
