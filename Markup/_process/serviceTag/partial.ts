export  = function partial(options, rootKey, gen, logicParent) {
    //TODO: give field name
    let fieldName = 'content';
    let opts = {};
    opts[fieldName] = options;
    return options.template(opts, rootKey, gen, logicParent)[0];
}