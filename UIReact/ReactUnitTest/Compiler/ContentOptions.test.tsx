import * as React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import OneRoot from './resources/OneRoot';
import MultipleRoots from './resources/MultipleRoots';
import Condition from './resources/Condition';
import ConditionWithElse from './resources/ConditionWithElse';
import OneRootWithAdditionalProps from './resources/OneRootWithAdditionalProps';
import MultipleRootsWithAdditionalProps from './resources/MultipleRootsWithAdditionalProps';
import ConditionWithAdditionalProps from './resources/ConditionWithAdditionalProps';

const isBrowser = typeof window !== 'undefined';
const describeIf = (condition) => condition ? describe : describe.skip;

describeIf(isBrowser)('вставка контентных опций в чистом реакте', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        unmountComponentAtNode(container);
        container.remove();
        container = null;
    });

    it('Один корень', () => {
        act(() => {
            render(<OneRoot />, container);
        });

        expect(container).toMatchSnapshot();
    });

    it('Несколько корней', () => {
        act(() => {
            render(<MultipleRoots />, container);
        });

        expect(container).toMatchSnapshot();
    });

    it('Условие в корне', () => {
        act(() => {
            render(<Condition renderContent={true} />, container);
        });

        expect(container).toMatchSnapshot();

        unmountComponentAtNode(container);

        act(() => {
            render(<Condition renderContent={false} />, container);
        });

        expect(container).toMatchSnapshot();
    });

    it('Условие с else в корне', () => {
        act(() => {
            render(<ConditionWithElse renderContent={true} />, container);
        });

        expect(container).toMatchSnapshot();

        unmountComponentAtNode(container);

        act(() => {
            render(<ConditionWithElse renderContent={false} />, container);
        });

        expect(container).toMatchSnapshot();
    });

    describe('передача дополнительных опций в контентную опцию', () => {
        it('Один корень', () => {
            act(() => {
                render(<OneRootWithAdditionalProps />, container);
            });

            expect(container).toMatchSnapshot();
        });

        it('Несколько корней', () => {
            act(() => {
                render(<MultipleRootsWithAdditionalProps />, container);
            });

            expect(container).toMatchSnapshot();
        });

        it('Условие в корне', () => {
            act(() => {
                render(<ConditionWithAdditionalProps renderContent={true} />, container);
            });

            expect(container).toMatchSnapshot();

            unmountComponentAtNode(container);

            act(() => {
                render(<ConditionWithAdditionalProps renderContent={false} />, container);
            });

            expect(container).toMatchSnapshot();
        });
    });
});
