define('UITest/_compiler/codegen/resources', [
    'text!UITest/_compiler/codegen/resources/template_0.txt',
    'text!UITest/_compiler/codegen/resources/template_1.txt',
    'text!UITest/_compiler/codegen/resources/template_2.txt'
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