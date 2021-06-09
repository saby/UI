import * as React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import { createSandbox } from 'sinon';
import { assert } from 'chai';
// FIXME: типы для jsdom нигде не подцеплены, подцепим после переезда на jest
// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import { JSDOM } from 'jsdom';
import TestControl from './TestControl';
import TestControl2 from './TestControl2';
import TestControl2Inner from './TestControl2Inner';
import ControlWithState from './ControlWithState';

describe('UIReact/UICore/_base/Control', () => {
    describe('хуки жизненного цикла', () => {
        let container;
        let sandbox;

        // не выношу это в describe повыше, чтобы тесты построения на сервере не нужно было выносить в отдельный файл
        before(() => {
            const browser = new JSDOM();
            global.window = browser.window;
            global.document = window.document;
        });

        after(() => {
            delete global.window;
            delete global.document;
        });

        let clock;
        beforeEach(() => {
            sandbox = createSandbox();
            /*
            _afterMount и _afterUpdate зовутся в отдельной таске, чтобы браузер мог отрисовать кадр.
            Чтобы не делать тесты асинхронными, мы просто мокнем таймеры и сами будем управлять временем.
             */
            clock = sandbox.useFakeTimers();
            container = document.createElement('div');
            document.body.appendChild(container);
        });

        afterEach(() => {
            clock.restore();
            sandbox.restore();
            unmountComponentAtNode(container);
            container.remove();
            container = null;
        });

        /**
         * Эта функция существует для того, чтобы не забывать оборачивать тики в act.
         * Это нужно, чтобы реакт реагировал на изменение времени и обновлял компоненты.
         * @param duration Значение, на которое должно продвинуться время.
         */
        function tick(duration: number): void {
            act(() => {
                clock.tick(duration);
            });
        }

        /**
         * Асинхронный аналог {@link tick}, отличается тем, что эта версия позволяет выполниться коллбекам промисов.
         * @param duration Значение, на которое должно продвинуться время.
         */
        async function tickAsync(duration: number): Promise<void> {
            return act(async () => {
                // в новой версии sinon есть clock.tickAsync, который в теории делает то же самое
                clock.tick(duration);
                await Promise.resolve();
            });
        }

        it('при первом построении должны вызываться только хуки mount-фазы', () => {
            // region Setup
            const _beforeMountStub = sandbox.stub(
                TestControl.prototype,
                '_beforeMount'
            );
            const _componentDidMountStub = sandbox.stub(
                TestControl.prototype,
                '_componentDidMount'
            );
            const _afterMountStub = sandbox.stub(
                TestControl.prototype,
                '_afterMount'
            );

            const _beforeUpdateStub = sandbox.stub(
                TestControl.prototype,
                '_beforeUpdate'
            );
            const _afterRenderStub = sandbox.stub(
                TestControl.prototype,
                '_afterRender'
            );
            const _afterUpdateStub = sandbox.stub(
                TestControl.prototype,
                '_afterUpdate'
            );

            const _beforeUnmountStub = sandbox.stub(
                TestControl.prototype,
                '_beforeUnmount'
            );
            // endregion

            act(() => {
                render(<TestControl />, container);
            });
            tick(0);

            sandbox.assert.callOrder(
                _beforeMountStub,
                _componentDidMountStub,
                _afterMountStub
            );
            sandbox.assert.notCalled(_beforeUpdateStub);
            sandbox.assert.notCalled(_afterRenderStub);
            sandbox.assert.notCalled(_afterUpdateStub);
            sandbox.assert.notCalled(_beforeUnmountStub);
        });

        it('при построении с асинхронным _beforeMount должны вызываться только хуки mount-фазы', async () => {
            // region Setup
            const _componentDidMountStub = sandbox.stub(
                TestControl.prototype,
                '_componentDidMount'
            );
            const _afterMountStub = sandbox.stub(
                TestControl.prototype,
                '_afterMount'
            );

            const _beforeUpdateStub = sandbox.stub(
                TestControl.prototype,
                '_beforeUpdate'
            );
            const _afterRenderStub = sandbox.stub(
                TestControl.prototype,
                '_afterRender'
            );
            const _afterUpdateStub = sandbox.stub(
                TestControl.prototype,
                '_afterUpdate'
            );

            const _beforeUnmountStub = sandbox.stub(
                TestControl.prototype,
                '_beforeUnmount'
            );
            // endregion
            const PROMISE_WAIT_TIME = 1000;
            const _beforeMountStub = sandbox
                .stub(TestControl.prototype, '_beforeMount')
                .callsFake(
                    (): Promise<void> => {
                        return new Promise((resolve) => {
                            setTimeout(() => {
                                resolve();
                            }, PROMISE_WAIT_TIME);
                        });
                    }
                );

            act(() => {
                render(<TestControl />, container);
            });

            sandbox.assert.calledOnce(_beforeMountStub);
            sandbox.assert.notCalled(_componentDidMountStub);
            sandbox.assert.notCalled(_afterMountStub);

            // на всякий случай проверяем, что даже в следующем тике не вызвался ни один хук
            tick(0);

            sandbox.assert.calledOnce(_beforeMountStub);
            sandbox.assert.notCalled(_componentDidMountStub);
            sandbox.assert.notCalled(_afterMountStub);

            await tickAsync(PROMISE_WAIT_TIME);
            tick(0);

            sandbox.assert.callOrder(
                _componentDidMountStub,
                _afterMountStub
            );

            sandbox.assert.notCalled(_beforeUpdateStub);
            sandbox.assert.notCalled(_afterRenderStub);
            sandbox.assert.notCalled(_afterUpdateStub);
            sandbox.assert.notCalled(_beforeUnmountStub);
        });

        it('при обновлении должны вызываться только хуки update-фазы', () => {
            // region Setup
            // небольшой компонент, который прокидывает состояние в ребёнка
            class Parent extends React.Component<
                {},
                {
                    childOption: string;
                }
                > {
                constructor(props: {}) {
                    super(props);
                    this.state = {
                        childOption: '123'
                    };
                }
                render(): React.ReactNode {
                    return <TestControl testOption={this.state.childOption} />;
                }
            }
            const _beforeMountStub = sandbox.stub(
                TestControl.prototype,
                '_beforeMount'
            );
            const _componentDidMountStub = sandbox.stub(
                TestControl.prototype,
                '_componentDidMount'
            );
            const _afterMountStub = sandbox.stub(
                TestControl.prototype,
                '_afterMount'
            );

            const _beforeUpdateStub = sandbox.stub(
                TestControl.prototype,
                '_beforeUpdate'
            );
            const _shouldUpdateStub = sandbox.spy(
                TestControl.prototype,
                '_shouldUpdate'
            );
            const _afterRenderStub = sandbox.stub(
                TestControl.prototype,
                '_afterRender'
            );
            const _afterUpdateStub = sandbox.stub(
                TestControl.prototype,
                '_afterUpdate'
            );

            const _beforeUnmountStub = sandbox.stub(
                TestControl.prototype,
                '_beforeUnmount'
            );

            // отрисовываем компонент и сразу дожидаемся _afterMount
            let instance;
            act(() => {
                instance = render(<Parent />, container);
            });
            tick(0);
            // endregion

            // обновлений ещё не было, так что ничего не должно быть вызвано
            sandbox.assert.notCalled(_beforeUpdateStub);
            sandbox.assert.notCalled(_shouldUpdateStub);
            sandbox.assert.notCalled(_afterRenderStub);
            sandbox.assert.notCalled(_afterUpdateStub);

            act(() => {
                instance.setState({
                    childOption: '456'
                });
            });
            tick(0);

            sandbox.assert.callOrder(
                _beforeUpdateStub,
                _shouldUpdateStub,
                _afterRenderStub,
                _afterUpdateStub
            );
            /*
            другой тест проверяет, что хуки mount-фазы вызываются в нужное время,
            здесь мы просто проверяем, что они не вызывались при обновлении
             */
            sandbox.assert.calledOnce(_beforeMountStub);
            sandbox.assert.calledOnce(_componentDidMountStub);
            sandbox.assert.calledOnce(_afterMountStub);
            sandbox.assert.notCalled(_beforeUnmountStub);
        });

        it('_beforeUnmount вызывается при уничтожении компонента', () => {
            // region Setup
            const _beforeMountStub = sandbox.stub(
                TestControl.prototype,
                '_beforeMount'
            );
            const _componentDidMountStub = sandbox.stub(
                TestControl.prototype,
                '_componentDidMount'
            );
            const _afterMountStub = sandbox.stub(
                TestControl.prototype,
                '_afterMount'
            );

            const _beforeUpdateStub = sandbox.stub(
                TestControl.prototype,
                '_beforeUpdate'
            );
            const _afterRenderStub = sandbox.stub(
                TestControl.prototype,
                '_afterRender'
            );
            const _afterUpdateStub = sandbox.stub(
                TestControl.prototype,
                '_afterUpdate'
            );

            const _beforeUnmountStub = sandbox.stub(
                TestControl.prototype,
                '_beforeUnmount'
            );
            // небольшой компонент, который по флагу рисует детей
            class Parent extends React.Component<
                {
                    children: React.ReactElement;
                },
                {
                    renderChildren: boolean;
                }
            > {
                constructor(props: { children: React.ReactElement }) {
                    super(props);
                    this.state = {
                        renderChildren: true
                    };
                }
                render(): React.ReactNode {
                    return this.state.renderChildren ? (
                        this.props.children
                    ) : (
                        <div>123</div>
                    );
                }
            }

            // отрисовываем компонент и сразу дожидаемся _afterMount
            let instance;
            act(() => {
                instance = render(
                    <Parent>
                        <TestControl />
                    </Parent>,
                    container
                );
            });
            tick(0);
            // endregion

            act(() => {
                instance.setState({
                    renderChildren: false
                });
            });

            sandbox.assert.calledOnce(_beforeUnmountStub);

            /*
            другой тест проверяет, что хуки mount-фазы вызываются в нужное время,
            здесь мы просто проверяем, что они не вызывались при уничтожении
             */
            sandbox.assert.calledOnce(_beforeMountStub);
            sandbox.assert.calledOnce(_componentDidMountStub);
            sandbox.assert.calledOnce(_afterMountStub);
            /*
            другой тест проверяет, что хуки update-фазы вызываются в нужное время,
            здесь мы просто проверяем, что они не вызывались при уничтожении
             */
            sandbox.assert.notCalled(_beforeUpdateStub);
            sandbox.assert.notCalled(_afterRenderStub);
            sandbox.assert.notCalled(_afterUpdateStub);
        });

        it('при вызове синхронного _beforeMount аргументы метода и состояние инстанса совпадают с Wasaby', () => {
            const _beforeMountStub = sandbox
                .stub(TestControl.prototype, '_beforeMount')
                .callsFake(function (this: TestControl): void {
                    assert.isEmpty(this._options);
                });

            act(() => {
                render(<TestControl testOption="123" />, container);
            });

            const expectedOptions = {
                theme: 'default',
                readOnly: false,
                testOption: '123'
            };
            const expectedContext = {};
            const expectedReceivedState = undefined;
            sandbox.assert.calledWithExactly(_beforeMountStub, expectedOptions, expectedContext, expectedReceivedState);
        });

        it('при вызове асинхронного _beforeMount состояние инстанса не меняется до завершения асинхронщины', () => {
            let resolved = false; // по сути это флаг для контроля того, что мы в тесте попали в коллбек Promise
            const PROMISE_WAIT_TIME = 1000;
            const _beforeMountStub = sandbox
                .stub(TestControl.prototype, '_beforeMount')
                .callsFake(function (this: TestControl): Promise<void> {
                    assert.isEmpty(this._options);
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            assert.isEmpty(this._options);
                            resolved = true;
                            resolve();
                        }, PROMISE_WAIT_TIME);
                    });
                });

            act(() => {
                render(<TestControl testOption="123" />, container);
            });

            const expectedOptions = {
                theme: 'default',
                readOnly: false,
                testOption: '123'
            };
            const expectedContext = {};
            const expectedReceivedState = undefined;
            sandbox.assert.calledWithExactly(_beforeMountStub, expectedOptions, expectedContext, expectedReceivedState);
            assert.isFalse(resolved);

            tick(PROMISE_WAIT_TIME);

            assert.isTrue(resolved);
        });

        it('_beforeMount вызывается до монтирования DOM', () => {
            const _beforeMountStub = sandbox
                .stub(TestControl.prototype, '_beforeMount')
                .callsFake(() => {
                    // нам нужно проверять состояние DOM в момент вызова, поэтому приходится делать это здесь
                    assert.isNull(document.getElementById('testContainer'));
                });

            act(() => {
                render(<TestControl />, container);
            });

            sandbox.assert.calledOnce(_beforeMountStub);
        });

        it('при вызове _componentDidMount аргументы метода и состояние инстанса совпадают с Wasaby', () => {
            const expectedOptions = {
                theme: 'default',
                readOnly: false,
                testOption: '123'
            };
            const _componentDidMountStub = sandbox
                .stub(TestControl.prototype, '_componentDidMount')
                .callsFake(function (this: TestControl): void {
                    assert.deepEqual(this._options, expectedOptions);
                });

            act(() => {
                render(<TestControl testOption="123" />, container);
            });

            sandbox.assert.calledWithExactly(
                _componentDidMountStub,
                expectedOptions
            );
        });

        it('_componentDidMount вызывается после монтирования DOM, но до отрисовки кадра', () => {
            /*
            Весь тест завязан на двух вещах:
            1) _beforeMount вызывается до _componentDidMount.
            2) Они вызываются в одной таске.
            Т.е. если мы попытаемся что-то сделать в _beforeMount через setTimeout, то оно не успеет.

            Да, этот тест не идеален, потому что если запустить _componentDidMount в отдельной таске до
            вызова _beforeMount, то поведение сломается, а тест пройдёт, но это лучшее, что я могу сейчас придумать.
             */
            let domPainted = false;
            sandbox
                .stub(TestControl.prototype, '_beforeMount')
                .callsFake(() => {
                    setTimeout(() => {
                        domPainted = true;
                    });
                });
            const _componentDidMountStub = sandbox
                .stub(TestControl.prototype, '_componentDidMount')
                .callsFake(() => {
                    // нам нужно проверять состояние DOM в момент вызова, поэтому приходится делать это здесь
                    assert.isFalse(domPainted);
                    assert.equal(
                        document.getElementById('testContainer').textContent,
                        '123'
                    );
                });

            act(() => {
                render(<TestControl />, container);
            });

            sandbox.assert.calledOnce(_componentDidMountStub);
        });

        it('при вызове _afterMount аргументы метода и состояние инстанса совпадают с Wasaby', () => {
            const expectedOptions = {
                theme: 'default',
                readOnly: false,
                testOption: '123'
            };
            const _afterMountStub = sandbox
                .stub(TestControl.prototype, '_afterMount')
                .callsFake(function (this: TestControl): void {
                    assert.deepEqual(this._options, expectedOptions);
                });

            act(() => {
                render(<TestControl testOption="123" />, container);
            });
            tick(0);

            sandbox.assert.calledWithExactly(_afterMountStub, expectedOptions);
        });

        it('_afterMount вызывается после монтирования DOM и отрисовки кадра', () => {
            /*
            Здесь довольно простая логика: если _afterMount позвался в отдельной от рендера таске,
            то кадр успел отрисоваться.
             */
            const _afterMountStub = sandbox
                .stub(TestControl.prototype, '_afterMount')
                .callsFake(() => {
                    // нам нужно проверять состояние DOM в момент вызова, поэтому приходится делать это здесь
                    assert.equal(
                        document.getElementById('testContainer').textContent,
                        '123'
                    );
                });

            act(() => {
                render(<TestControl />, container);
            });

            sandbox.assert.notCalled(_afterMountStub);

            tick(0);

            sandbox.assert.calledOnce(_afterMountStub);
        });

        it('_beforeUpdate вызывается до вызова шаблона', () => {
            // region Setup
            // небольшой компонент, который прокидывает состояние в ребёнка
            class Parent extends React.Component<
                {},
                {
                    childOption: string;
                }
                > {
                constructor(props: {}) {
                    super(props);
                    this.state = {
                        childOption: '123'
                    };
                }
                render(): React.ReactNode {
                    return <ControlWithState testOption={this.state.childOption} />;
                }
            }
            // отрисовываем компонент и сразу дожидаемся _afterMount
            let instance;
            act(() => {
                instance = render(<Parent />, container);
            });
            tick(0);
            // endregion
            const _beforeUpdateStub = sandbox
                .stub(ControlWithState.prototype, '_beforeUpdate')
                .callsFake(function(): void {
                    this._someState = 1;
                });

            assert.equal(
                document.getElementById('testContainer').textContent,
                '0123'
            );

            act(() => {
                instance.setState({
                    childOption: '456'
                });
            });

            sandbox.assert.calledOnce(_beforeUpdateStub);
            assert.equal(
                document.getElementById('testContainer').textContent,
                '1456'
            );
        });

        it('при вызове _beforeUpdate аргументы метода и состояние инстанса совпадают с Wasaby', () => {
            // region Setup
            // небольшой компонент, который прокидывает состояние в ребёнка
            class Parent extends React.Component<
                {},
                {
                    childOption: string;
                }
            > {
                constructor(props: {}) {
                    super(props);
                    this.state = {
                        childOption: '123'
                    };
                }
                render(): React.ReactNode {
                    return <TestControl testOption={this.state.childOption} />;
                }
            }
            const oldOptions = {
                theme: 'default',
                readOnly: false,
                testOption: '123'
            };
            const newOptions = {
                theme: 'default',
                readOnly: false,
                testOption: '456'
            };
            // endregion

            const _beforeUpdateStub = sandbox
                .stub(TestControl.prototype, '_beforeUpdate')
                .callsFake(function (this: TestControl): void {
                    assert.deepEqual(this._options, oldOptions);
                });
            // отрисовываем компонент и сразу дожидаемся _afterMount
            let instance;
            act(() => {
                instance = render(<Parent />, container);
            });
            tick(0);

            act(() => {
                instance.setState({
                    childOption: '456'
                });
            });

            // TODO: https://online.sbis.ru/opendoc.html?guid=a9962c03-d5ca-432c-bc8b-a244e5a1b1ed
            const expectedContext = {scrollContext: {}};
            sandbox.assert.calledWithExactly(_beforeUpdateStub, newOptions, expectedContext);
        });

        it('_beforeUpdate вызывается до обновления DOM', () => {
            // region Setup
            // небольшой компонент, который прокидывает состояние в ребёнка
            class Parent extends React.Component<
                {},
                {
                    childOption: string;
                }
            > {
                constructor(props: {}) {
                    super(props);
                    this.state = {
                        childOption: '123'
                    };
                }
                render(): React.ReactNode {
                    return <TestControl testOption={this.state.childOption} />;
                }
            }
            // отрисовываем компонент и сразу дожидаемся _afterMount
            let instance;
            act(() => {
                instance = render(<Parent />, container);
            });
            tick(0);
            // endregion
            const _beforeUpdateStub = sandbox
                .stub(TestControl.prototype, '_beforeUpdate')
                .callsFake(() => {
                    // нам нужно проверять состояние DOM в момент вызова, поэтому приходится делать это здесь
                    assert.equal(
                        document.getElementById('testContainer').textContent,
                        '123'
                    );
                });

            act(() => {
                instance.setState({
                    childOption: '456'
                });
            });

            sandbox.assert.calledOnce(_beforeUpdateStub);
            assert.equal(
                document.getElementById('testContainer').textContent,
                '456'
            );
        });

        it('при вызове _afterRender аргументы метода и состояние инстанса совпадают с Wasaby', () => {
            // region Setup
            // небольшой компонент, который прокидывает состояние в ребёнка
            class Parent extends React.Component<
                {},
                {
                    childOption: string;
                }
            > {
                constructor(props: {}) {
                    super(props);
                    this.state = {
                        childOption: '123'
                    };
                }
                render(): React.ReactNode {
                    return <TestControl testOption={this.state.childOption} />;
                }
            }
            const oldOptions = {
                theme: 'default',
                readOnly: false,
                testOption: '123'
            };
            const newOptions = {
                theme: 'default',
                readOnly: false,
                testOption: '456'
            };
            // endregion

            const _afterRenderStub = sandbox
                .stub(TestControl.prototype, '_afterRender')
                .callsFake(function (this: TestControl): void {
                    assert.deepEqual(this._options, newOptions);
                });
            // отрисовываем компонент и сразу дожидаемся _afterMount
            let instance;
            act(() => {
                instance = render(<Parent />, container);
            });
            tick(0);

            act(() => {
                instance.setState({
                    childOption: '456'
                });
            });

            sandbox.assert.calledWithExactly(_afterRenderStub, oldOptions);
        });

        it('_afterRender вызывается после обновления DOM, но до отрисовки кадра', () => {
            /*
            Весь тест завязан на двух вещах:
            1) _beforeUpdate вызывается до _afterRender.
            2) Они вызываются в одной таске.
            Т.е. если мы попытаемся что-то сделать в _beforeUpdate через setTimeout, то оно не успеет.

            Да, этот тест не идеален, потому что если запустить _afterRender в отдельной таске до
            вызова _beforeUpdate, то поведение сломается, а тест пройдёт, но это лучшее, что я могу сейчас придумать.
             */
            // region Setup
            // небольшой компонент, который прокидывает состояние в ребёнка
            class Parent extends React.Component<
                {},
                {
                    childOption: string;
                }
            > {
                constructor(props: {}) {
                    super(props);
                    this.state = {
                        childOption: '123'
                    };
                }
                render(): React.ReactNode {
                    return <TestControl testOption={this.state.childOption} />;
                }
            }
            // endregion
            let domPainted = false;
            sandbox
                .stub(TestControl.prototype, '_beforeUpdate')
                .callsFake(() => {
                    setTimeout(() => {
                        domPainted = true;
                    });
                });

            const _afterRenderStub = sandbox
                .stub(TestControl.prototype, '_afterRender')
                .callsFake(() => {
                    assert.isFalse(domPainted);
                    assert.equal(
                        document.getElementById('testContainer').textContent,
                        '456'
                    );
                });
            // отрисовываем компонент и сразу дожидаемся _afterMount
            let instance;
            act(() => {
                instance = render(<Parent />, container);
            });
            tick(0);

            act(() => {
                instance.setState({
                    childOption: '456'
                });
            });

            sandbox.assert.calledOnce(_afterRenderStub);
        });

        it('при вызове _afterUpdate аргументы метода и состояние инстанса совпадают с Wasaby', () => {
            // region Setup
            // небольшой компонент, который прокидывает состояние в ребёнка
            class Parent extends React.Component<
                {},
                {
                    childOption: string;
                }
            > {
                constructor(props: {}) {
                    super(props);
                    this.state = {
                        childOption: '123'
                    };
                }
                render(): React.ReactNode {
                    return <TestControl testOption={this.state.childOption} />;
                }
            }
            const oldOptions = {
                theme: 'default',
                readOnly: false,
                testOption: '123'
            };
            const newOptions = {
                theme: 'default',
                readOnly: false,
                testOption: '456'
            };
            // endregion

            const _afterUpdateStub = sandbox
                .stub(TestControl.prototype, '_afterUpdate')
                .callsFake(function (this: TestControl): void {
                    assert.deepEqual(this._options, newOptions);
                });
            // отрисовываем компонент и сразу дожидаемся _afterMount
            let instance;
            act(() => {
                instance = render(<Parent />, container);
            });
            tick(0);

            act(() => {
                instance.setState({
                    childOption: '456'
                });
            });
            tick(0);

            sandbox.assert.calledWithExactly(_afterUpdateStub, oldOptions);
        });

        it('_afterUpdate вызывается после обновления DOM и отрисовки кадра', () => {
            /*
            Здесь довольно простая логика: если _afterUpdate позвался в отдельной от рендера таске,
            то кадр успел отрисоваться.
             */
            // region Setup
            // небольшой компонент, который прокидывает состояние в ребёнка
            class Parent extends React.Component<
                {},
                {
                    childOption: string;
                }
            > {
                constructor(props: {}) {
                    super(props);
                    this.state = {
                        childOption: '123'
                    };
                }
                render(): React.ReactNode {
                    return <TestControl testOption={this.state.childOption} />;
                }
            }
            const _afterUpdateStub = sandbox.stub(
                TestControl.prototype,
                '_afterUpdate'
            ).callsFake(() => {
                // нам нужно проверять состояние DOM в момент вызова, поэтому приходится делать это здесь
                assert.equal(
                    document.getElementById('testContainer').textContent,
                    '456'
                );
            });
            // отрисовываем компонент и сразу дожидаемся _afterMount
            let instance;
            act(() => {
                instance = render(<Parent />, container);
            });
            tick(0);
            // endregion

            act(() => {
                instance.setState({
                    childOption: '456'
                });
            });

            sandbox.assert.notCalled(_afterUpdateStub);

            tick(0);

            sandbox.assert.calledOnce(_afterUpdateStub);
        });

        describe('порядок вызова хуков с детьми', () => {
            // TODO: сейчас тесты написаны только на mount-хуки
            /*
            В Wasaby было так:
            outer _beforeMount
            inner _beforeMount
            inner _componentDidMount
            outer _componentDidMount
            inner _afterMount
            outer _afterMount
            outer _beforeUpdate
            outer _shouldUpdate
            inner _beforeUpdate
            inner _shouldUpdate
            inner _afterRender
            outer _afterRender
            inner _afterUpdate
            outer _afterUpdate
             */

            describe('асинхронный ребёнок', () => {
                it('порядок mount хуков совпадает с Wasaby', async () => {
                    // region Setup
                    const _beforeMountOuter = sandbox.stub(
                        TestControl2.prototype,
                        '_beforeMount'
                    );
                    const _componentDidMountOuter = sandbox.stub(
                        TestControl2.prototype,
                        '_componentDidMount'
                    );
                    const _afterMountOuter = sandbox.stub(
                        TestControl2.prototype,
                        '_afterMount'
                    );
                    const _beforeUpdateOuter = sandbox.stub(
                        TestControl2.prototype,
                        '_beforeUpdate'
                    );
                    const _afterRenderOuter = sandbox.stub(
                        TestControl2.prototype,
                        '_afterRender'
                    );
                    const _afterUpdateOuter = sandbox.stub(
                        TestControl2.prototype,
                        '_afterUpdate'
                    );

                    const CHILD_TIMEOUT_DURATION = 100;
                    const _beforeMountInner = sandbox.stub(
                        TestControl2Inner.prototype,
                        '_beforeMount'
                    ).callsFake(
                        (): Promise<void> => {
                            return new Promise((resolve) => {
                                setTimeout(() => {
                                    resolve();
                                }, CHILD_TIMEOUT_DURATION);
                            });
                        }
                    );
                    const _componentDidMountInner = sandbox.stub(
                        TestControl2Inner.prototype,
                        '_componentDidMount'
                    );
                    const _afterMountInner = sandbox.stub(
                        TestControl2Inner.prototype,
                        '_afterMount'
                    );
                    const _beforeUpdateInner = sandbox.stub(
                        TestControl2Inner.prototype,
                        '_beforeUpdate'
                    );
                    const _afterRenderInner = sandbox.stub(
                        TestControl2Inner.prototype,
                        '_afterRender'
                    );
                    const _afterUpdateInner = sandbox.stub(
                        TestControl2Inner.prototype,
                        '_afterUpdate'
                    );
                    // endregion

                    act(() => {
                        render(<TestControl2 />, container);
                    });

                    sandbox.assert.calledOnce(_beforeMountOuter);
                    sandbox.assert.calledOnce(_beforeMountInner);
                    sandbox.assert.callOrder(_beforeMountOuter, _beforeMountInner);

                    await tickAsync(CHILD_TIMEOUT_DURATION);

                    sandbox.assert.calledOnce(_componentDidMountInner);
                    sandbox.assert.calledOnce(_componentDidMountOuter);
                    sandbox.assert.callOrder(_componentDidMountInner, _componentDidMountOuter);
                    sandbox.assert.notCalled(_afterMountInner);
                    sandbox.assert.notCalled(_afterMountOuter);

                    tick(0);

                    sandbox.assert.calledOnce(_afterMountInner);
                    sandbox.assert.calledOnce(_afterMountOuter);
                    sandbox.assert.callOrder(
                        _afterMountInner,
                        _afterMountOuter
                    );

                    sandbox.assert.notCalled(_beforeUpdateOuter);
                    sandbox.assert.notCalled(_afterRenderOuter);
                    sandbox.assert.notCalled(_afterUpdateOuter);
                    sandbox.assert.notCalled(_beforeUpdateInner);
                    sandbox.assert.notCalled(_afterRenderInner);
                    sandbox.assert.notCalled(_afterUpdateInner);
                });
            });

            describe('синхронный ребёнок', () => {
                it('порядок mount хуков совпадает с Wasaby', () => {
                    // region Setup
                    const _beforeMountOuter = sandbox.stub(
                        TestControl2.prototype,
                        '_beforeMount'
                    );
                    const _componentDidMountOuter = sandbox.stub(
                        TestControl2.prototype,
                        '_componentDidMount'
                    );
                    const _afterMountOuter = sandbox.stub(
                        TestControl2.prototype,
                        '_afterMount'
                    );
                    const _beforeUpdateOuter = sandbox.stub(
                        TestControl2.prototype,
                        '_beforeUpdate'
                    );
                    const _afterRenderOuter = sandbox.stub(
                        TestControl2.prototype,
                        '_afterRender'
                    );
                    const _afterUpdateOuter = sandbox.stub(
                        TestControl2.prototype,
                        '_afterUpdate'
                    );

                    const _beforeMountInner = sandbox.stub(
                        TestControl2Inner.prototype,
                        '_beforeMount'
                    );
                    const _componentDidMountInner = sandbox.stub(
                        TestControl2Inner.prototype,
                        '_componentDidMount'
                    );
                    const _afterMountInner = sandbox.stub(
                        TestControl2Inner.prototype,
                        '_afterMount'
                    );
                    const _beforeUpdateInner = sandbox.stub(
                        TestControl2Inner.prototype,
                        '_beforeUpdate'
                    );
                    const _afterRenderInner = sandbox.stub(
                        TestControl2Inner.prototype,
                        '_afterRender'
                    );
                    const _afterUpdateInner = sandbox.stub(
                        TestControl2Inner.prototype,
                        '_afterUpdate'
                    );
                    // endregion

                    act(() => {
                        render(<TestControl2 />, container);
                    });

                    sandbox.assert.calledOnce(_beforeMountOuter);
                    sandbox.assert.calledOnce(_beforeMountInner);
                    sandbox.assert.calledOnce(_componentDidMountInner);
                    sandbox.assert.calledOnce(_componentDidMountOuter);
                    sandbox.assert.callOrder(
                        _beforeMountOuter,
                        _beforeMountInner,
                        _componentDidMountInner,
                        _componentDidMountOuter
                    );
                    sandbox.assert.notCalled(_afterMountInner);
                    sandbox.assert.notCalled(_afterMountOuter);

                    tick(0);

                    sandbox.assert.calledOnce(_afterMountInner);
                    sandbox.assert.calledOnce(_afterMountOuter);
                    sandbox.assert.callOrder(
                        _afterMountInner,
                        _afterMountOuter
                    );

                    sandbox.assert.notCalled(_beforeUpdateOuter);
                    sandbox.assert.notCalled(_afterRenderOuter);
                    sandbox.assert.notCalled(_afterUpdateOuter);
                    sandbox.assert.notCalled(_beforeUpdateInner);
                    sandbox.assert.notCalled(_afterRenderInner);
                    sandbox.assert.notCalled(_afterUpdateInner);
                });
            });
        });
    });
});
