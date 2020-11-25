define('UITest/Utils/resources/TestControlAsync', [
    'UI/Base',
    'wml!UITest/Utils/resources/TestControlAsync'
],
function (UiBase, template) {
    return {
        default: UiBase.Control.extend({
            _template: template
        })
    };
});
