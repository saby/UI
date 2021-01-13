const eventMap = {
    onclick: 'onClick',
    onchange: 'onChange'
};
function repairEventName(eventName: string): string {
    return eventMap[eventName] || eventName;
}
export {repairEventName};
