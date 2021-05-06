import {Container, ContainerType} from 'Compiler/core/internal/Container';
import {ProgramType} from 'Compiler/core/internal/Storage';
import {Parser} from 'Compiler/expressions/Parser';
import {assert} from 'chai';

function parse(text: string) {
    return new Parser().parse(text);
}

describe('Compiler/core/internal/Container', () => {
    let globalContainer: Container;

    beforeEach(() => {
        globalContainer = new Container(null, ContainerType.GLOBAL);
    });

    afterEach(() => {
        globalContainer = null;
    });

    it('register programs and check identifiers', () => {
        const identifiers = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n'];
        globalContainer.registerProgram(parse('a+b'), ProgramType.SIMPLE, 'simple');
        globalContainer.registerProgram(parse('c/d'), ProgramType.ATTRIBUTE, 'attribute');
        globalContainer.registerProgram(parse('e*f'), ProgramType.BIND, 'bind');
        globalContainer.registerProgram(parse('g(h)'), ProgramType.EVENT, 'event');
        globalContainer.registerProgram(parse('i?j:k'), ProgramType.OPTION, 'option');
        globalContainer.registerProgram(parse('l.start()'), ProgramType.FLOAT, 'cycle');
        globalContainer.registerTestProgram(parse('m&&n'));
        const actual = globalContainer.getOwnIdentifiers().sort();
        assert.deepEqual(actual, identifiers);
    });

    it('register program and check identifiers (with initial identifier)', () => {
        const identifiers = ['a', 'b'];
        globalContainer.addIdentifier('a');
        globalContainer.registerProgram(parse('b'), ProgramType.SIMPLE, 'simple');
        const actual = globalContainer.getOwnIdentifiers().sort();
        assert.deepEqual(actual, identifiers);
    });

    it('register program and check identifiers on component/content option container type', () => {
        const componentContainer = globalContainer.createContainer(ContainerType.COMPONENT);
        const optionContainer = componentContainer.createContainer(ContainerType.CONTENT_OPTION);
        optionContainer.addIdentifier('content');
        componentContainer.registerProgram(parse('a'), ProgramType.ATTRIBUTE, 'attribute');
        componentContainer.registerProgram(parse('b'), ProgramType.OPTION, 'option');
        optionContainer.registerProgram(parse('c'), ProgramType.SIMPLE, 'data');
        optionContainer.registerProgram(parse('d + content.e'), ProgramType.SIMPLE, 'data');
        assert.deepEqual(optionContainer.getOwnIdentifiers().sort(), ['content']);
        assert.isEmpty(componentContainer.getOwnIdentifiers().sort());
        assert.deepEqual(globalContainer.getOwnIdentifiers().sort(), ['a', 'b', 'c', 'd']);
    });

    it('register program and check identifiers on template container type', () => {
        const templateContainer = globalContainer.createContainer(ContainerType.TEMPLATE);
        templateContainer.registerProgram(parse('a'), ProgramType.ATTRIBUTE, 'attribute');
        templateContainer.registerProgram(parse('b'), ProgramType.OPTION, 'option');
        assert.deepEqual(templateContainer.getOwnIdentifiers().sort(), ['a', 'b']);
        assert.deepEqual(globalContainer.getOwnIdentifiers().sort(), ['a', 'b']);
    });

    it('register program and check identifiers on conditional container type', () => {
        const conditionalContainer = globalContainer.createContainer(ContainerType.CONDITIONAL);
        conditionalContainer.registerTestProgram(parse('a||b'));
        assert.isEmpty(conditionalContainer.getOwnIdentifiers().sort());
        assert.deepEqual(globalContainer.getOwnIdentifiers().sort(), ['a', 'b']);
    });

    it('register program and check identifiers on cycle container type', () => {
        const cycleContainer = globalContainer.createContainer(ContainerType.CYCLE);
        cycleContainer.registerProgram(parse('a.init()'), ProgramType.FLOAT, 'data');
        cycleContainer.registerProgram(parse('a.test()'), ProgramType.FLOAT, 'data');
        cycleContainer.registerProgram(parse('a.update()'), ProgramType.FLOAT, 'data');
        cycleContainer.registerProgram(parse('a.value() + b'), ProgramType.SIMPLE, 'simple');
        assert.deepEqual(cycleContainer.getOwnIdentifiers().sort(), ['a']);
        assert.deepEqual(globalContainer.getOwnIdentifiers().sort(), ['a', 'b']);
    });

    describe('template and partial joining', () => {
        let template: Container;
        let partial: Container;


        beforeEach(() => {
            template = globalContainer.createContainer(ContainerType.TEMPLATE);
            partial = globalContainer.createContainer(ContainerType.COMPONENT);
            template.registerProgram(parse('a+b'), ProgramType.SIMPLE, null);
            template.registerProgram(parse('b+c'), ProgramType.SIMPLE, null);
            template.registerProgram(parse('c+d'), ProgramType.SIMPLE, null);
            partial.registerProgram(parse('a+d+e'), ProgramType.OPTION, 'option');
        });

        afterEach(() => {
            template = null;
            partial = null;
        });

        it('own identifiers before join', () => {
            assert.deepEqual(template.getOwnIdentifiers().sort(), ['a', 'b', 'c', 'd']);
            assert.deepEqual(partial.getOwnIdentifiers().sort(), []);
            assert.deepEqual(globalContainer.getOwnIdentifiers().sort(), ['a', 'b', 'c', 'd', 'e']);
        });

        it('own identifiers after join', () => {
            partial.joinContainer(template, ['a', 'c']);
            assert.deepEqual(template.getOwnIdentifiers().sort(), ['a', 'b', 'c', 'd']);
            assert.deepEqual(partial.getOwnIdentifiers().sort(), []);
            assert.deepEqual(globalContainer.getOwnIdentifiers().sort(), ['a', 'b', 'c', 'd', 'e']);
        });
    });

    describe('processing container index', () => {
        /**
         *                            global
         *                   component(1)      template
         *              content_option(1)          cycle(2)
         *          component(2)                       conditional(2)
         *      content_option(2)
         *   conditional(1)
         * cycle(1)
         */
        let component_1: Container;
        let content_option_1: Container;
        let component_2: Container;
        let content_option_2: Container;
        let conditional_1: Container;
        let cycle_1: Container;
        let template: Container;
        let cycle_2: Container;
        let conditional_2: Container;

        beforeEach(() => {
            component_1 = globalContainer.createContainer(ContainerType.COMPONENT);
            content_option_1 = component_1.createContainer(ContainerType.CONTENT_OPTION);
            component_2 = content_option_1.createContainer(ContainerType.COMPONENT);
            content_option_2 = component_2.createContainer(ContainerType.CONTENT_OPTION);
            conditional_1 = content_option_2.createContainer(ContainerType.CONDITIONAL);
            cycle_1 = conditional_1.createContainer(ContainerType.CYCLE);

            template = globalContainer.createContainer(ContainerType.TEMPLATE);
            cycle_2 = template.createContainer(ContainerType.CYCLE);
            conditional_2 = template.createContainer(ContainerType.CYCLE);
        });

        afterEach(() => {
            component_1 = null;
            content_option_1 = null;
            component_2 = null;
            content_option_2 = null;
            conditional_1 = null;
            cycle_1 = null;

            template = null;
            cycle_2 = null;
            conditional_2 = null;
        });

        it('cycle in content option #2', () => {
            assert.strictEqual(cycle_1.getProcessingContainerIndex(), content_option_2.index);
        });

        it('conditional in content option #2', () => {
            assert.strictEqual(conditional_1.getProcessingContainerIndex(), content_option_2.index);
        });

        it('content option #2 in component #2', () => {
            assert.strictEqual(content_option_2.getProcessingContainerIndex(), content_option_2.index);
        });

        it('component #2 in content option #1', () => {
            assert.strictEqual(component_2.getProcessingContainerIndex(), content_option_1.index);
        });

        it('content option #1 in component #1', () => {
            assert.strictEqual(content_option_1.getProcessingContainerIndex(), content_option_1.index);
        });

        it('component #1 in global', () => {
            assert.strictEqual(component_1.getProcessingContainerIndex(), globalContainer.index);
        });

        it('conditional in template', () => {
            assert.strictEqual(conditional_2.getProcessingContainerIndex(), template.index);
        });

        it('cycle in template', () => {
            assert.strictEqual(cycle_2.getProcessingContainerIndex(), template.index);
        });

        it('template in global', () => {
            assert.strictEqual(template.getProcessingContainerIndex(), template.index);
        });
    });
});
