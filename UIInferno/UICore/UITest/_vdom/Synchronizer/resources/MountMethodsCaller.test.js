define([
    'UICore/Vdom',
    'Types/shim'
 ], function(Vdom, shim) {
    'use strict';
 
    var MountMethodsCaller = Vdom._MountMethodsCaller;
 
    describe('MountMethodsCaller', () => {
       it('Call method after destroy', () => {
          let case1 = 0;
          let case2 = 0;
          let case3 = 0;
          const testNodes = {
             id: 0,
             control: {
                _mounted: true,
                _afterUpdate: function () {
                   case1 = 1;
                }
             },
             childrenNodes: [
                {
                   id: 1,
                   control: {
                      _mounted: true,
                      _afterUpdate: function () {
                         case2 = 1;
                      }
                   },
                   childrenNodes: []
                },
                {
                   id: 2,
                   control: {
                      _mounted: true,
                      _destroyed: true,
                      _afterUpdate: function () {
                         case3 = 1;
                      }
                   },
                   childrenNodes: []
                }
             ]
          };
 
          const cm = new MountMethodsCaller.default();
          cm.afterUpdate(cm.collectControlNodesToCall(testNodes, new shim.Set([0, 1, 2])));
          assert.equal(case1, 1);
          assert.equal(case2, 1);
          assert.equal(case3, 0);
       });
    });
 });
 