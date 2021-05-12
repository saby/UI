define('UIDemo/ReactDemo/Compatible/WS3Container',
    ['Lib/Control/CompoundControl/CompoundControl',
        'wml!UIDemo/ReactDemo/Compatible/WS3Container',
        'UIDemo/ReactDemo/Compatible/ReactComponent',
        'UI/Base'],
    function (Control, dotTplFn, WasabyComponent, UIBase) {
        'use strict';

        var Container = Control.extend({
            _dotTplFn: dotTplFn,
            _wasabyComponent: null,

            init: function () {
                const self = this;
                Container.superclass.init.call(self);
                self._wasabyComponent = UIBase.Control.createControl(WasabyComponent.default, {}, document.getElementById('wasabyTarget'));
                this.subscribeTo(self, 'onClick', function () {
                    self._wasabyComponent.changeCounter();
                });
            }
        });

        return Container;
    });
