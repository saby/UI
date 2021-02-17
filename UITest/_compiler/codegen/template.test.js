define([
    'Compiler/Compiler',
    'UITest/_compiler/codegen/resources'
], function(Compiler, resources) {
    'use strict';

    var wmlConfig = {
        fileName: 'Test/template.wml',
        fromBuilderTmpl: true
    };

    var tmplConfig = {
        fileName: 'Test/template.tmpl',
        fromBuilderTmpl: true
    };

    var compiler = new Compiler.Compiler();

    function isAllowedDuplication(mode, name) {
        // WARNING: Из-за особенностей генерации кода для tmpl в коде встречается несколько
        //   мест с function debug() { ... }. В проверке нужно пропускать этот момент, 
        //   поскольку не является критичным.
        return mode === 'tmpl' && name === 'debug';
    }

    function check(mode, code) {
        var regex = /function ([\w\d]+)\s*\(/gi;
        var storage = { };
        for (var match of code.matchAll(regex)) {
            var name = match[1];
            if (storage.hasOwnProperty(name) && !isAllowedDuplication(mode, name)) {
                throw new Error('Скомпилированный код содержит переопределение функций. Обнаружено переопределение функции "' + name + '"');
            }
            storage[name] = true;
        }
    }

    function getConfig(mode) {
        if (mode === 'wml') {
            return wmlConfig;
        }
        return tmplConfig;
    }

    function compileAndTest(mode, source, done) {
        compiler.compile(source, getConfig(mode))
            .then(function(artifact) {
                try {
                    check(mode, artifact.text);
                    done();
                } catch (error) {
                    done(error);
                }
            })
            .catch(function(artifact) {
                done(artifact.errors[0]);
            });
    }

    var modes = ['wml'];
    function test(source) {
        modes.forEach(function(mode) {
            it('Mode "' + mode + '"', function(done) {
                compileAndTest(mode, source, done);
            });
        });
    }

    describe('Check artifact text', function() {
        for (var index = 0; index < resources.size; ++index) {
            var name = resources.prefix + index;
            var source = resources[name];
            describe ('Template N' + index, function() {
                test(source);
            });
        }
    });
});