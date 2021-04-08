import { assert } from 'chai';
import { getProxyChildren } from 'UICommon/Base';
import { Control, IControlChildren } from 'UI/Base';

describe('UICommon/_base/ProxyChildren', () => {
  const _children = getProxyChildren<IControlChildren>() as IControlChildren;
  const testChild = new Control<{}, {}>({});
  // @ts-ignore
  _children.firstChild = testChild;

  it('check simple get child', () => {
    // @ts-ignore
    assert.equal(testChild, _children.firstChild as Control<{}, {}>);
  });

  it('throw warning if child not exist', () => {
    let failResult;
    try {
      failResult = _children.secondChild;
      assert.fail('does not throw warning!');
    } catch {
      assert.isTrue(failResult === undefined);
    }
  });
});
