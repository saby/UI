define('UITest/_compiler/codegen/resources', [
    'text!UITest/_compiler/codegen/resources/template_0.txt',
    'text!UITest/_compiler/codegen/resources/template_1.txt',
    'text!UITest/_compiler/codegen/resources/template_2.txt',
    'text!UITest/_compiler/codegen/resources/template_3.txt',
    'text!UITest/_compiler/codegen/resources/template_4.txt',
    'text!UITest/_compiler/codegen/resources/template_5.txt',
    'text!UITest/_compiler/codegen/resources/template_6.txt',
    'text!UITest/_compiler/codegen/resources/template_7.txt',
    'text!UITest/_compiler/codegen/resources/template_8.txt',
    'text!UITest/_compiler/codegen/resources/template_9.txt'
], function() {
    'use strict';

    var files = Array(...arguments);
    var prefix = 'resource_';
    var resources = {
        prefix: prefix,
        size: files.length
    };
    for (var index = 0; index < files.length; ++index) {
        resources[prefix + index] = files[index];
    }

    return resources;
});