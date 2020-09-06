/// <amd-module name="UI/_builder/Tmpl/core/Html" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Html.ts
 */

/**
 * HyperText Markup Language
 */
const HTML_NODES = [
   'a',
   'abbr',
   'acronym',
   'address',
   'applet',
   'area',
   'article',
   'aside',
   'audio',
   'b',
   'base',
   'basefont',
   'bdi',
   'bdo',
   'bgsound',
   'big',
   'blink',
   'blockquote',
   'body',
   'br',
   'button',
   'canvas',
   'caption',
   'center',
   'cite',
   'code',
   'col',
   'colgroup',
   'command',
   'content',
   'data',
   'datalist',
   'dd',
   'del',
   'details',
   'dfn',
   'dialog',
   'dir',
   'div',
   'dl',
   'dt',
   'element',
   'em',
   'embed',
   'fieldset',
   'figcaption',
   'figure',
   'font',
   'footer',
   'form',
   'frame',
   'frameset',
   'h1',
   'h2',
   'h3',
   'h4',
   'h5',
   'h6',
   'head',
   'header',
   'hgroup',
   'hr',
   'html',
   'i',
   'iframe',
   'image',
   'img',
   'input',
   'ins',
   'isindex',
   'kbd',
   'keygen',
   'label',
   'legend',
   'li',
   'link',
   'listing',
   'main',
   'main',
   'map',
   'mark',
   'marquee',
   'menu',
   'menuitem',
   'meta',
   'meter',
   'multicol',
   'nav',
   'nextid',
   'nobr',
   'noindex',
   'noembed',
   'noframes',
   'noscript',
   'object',
   'ol',
   'optgroup',
   'option',
   'output',
   'p',
   'param',
   'picture',
   'plaintext',
   'pre',
   'progress',
   'q',
   'rb',
   'rp',
   'rt',
   'rtc',
   'ruby',
   's',
   'samp',
   'script',
   'section',
   'select',
   'shadow',
   'slot',
   'small',
   'source',
   'spacer',
   'span',
   'strike',
   'strong',
   'style',
   'sub',
   'summary',
   'sup',
   'table',
   'tbody',
   'td',
   'template',
   'textarea',
   'tfoot',
   'th',
   'thead',
   'time',
   'title',
   'tr',
   'track',
   'tt',
   'u',
   'ul',
   'var',
   'video',
   'wbr',
   'xmp'
];

/**
 * Scalable Vector Graphics
 */
const SVG_NODES = [
   'a',
   'altGlyph',
   'altGlyphDef',
   'altGlyphItem',
   'animate',
   'animateColor',
   'animateMotion',
   'animateTransform',
   'circle',
   'clipPath',
   'color-profile',
   'cursor',
   'defs',
   'desc',
   'discard',
   'ellipse',
   'feBlend',
   'feColorMatrix',
   'feComponentTransfer',
   'feComposite',
   'feConvolveMatrix',
   'feDiffuseLighting',
   'feDisplacementMap',
   'feDistantLight',
   'feDropShadow',
   'feFlood',
   'feFuncA',
   'feFuncB',
   'feFuncG',
   'feFuncR',
   'feGaussianBlur',
   'feImage',
   'feMerge',
   'feMergeNode',
   'feMorphology',
   'feOffset',
   'fePointLight',
   'feSpecularLighting',
   'feSpotLight',
   'feTile',
   'feTurbulence',
   'filter',
   'font',
   'font-face',
   'font-face-format',
   'font-face-name',
   'font-face-src',
   'font-face-uri',
   'foreignObject',
   'g',
   'glyph',
   'glyphRef',
   'hatch',
   'hatchpath',
   'hkern',
   'image',
   'line',
   'linearGradient',
   'marker',
   'mask',
   'mesh',
   'meshGradient',
   'meshpatch',
   'meshrow',
   'metadata',
   'missing-glyph',
   'mpath',
   'path',
   'pattern',
   'polygon',
   'polyline',
   'radialGradient',
   'rect',
   'script',
   'set',
   'solidcolor',
   'stop',
   'style',
   'svg',
   'switch',
   'symbol',
   'text',
   'textPath',
   'title',
   'tref',
   'tspan',
   'use',
   'view',
   'vkern'
];

/**
 * Mathematical Markup Language
 */
const MATHML_NODES = [
   'annotation',
   'annotation-xml',
   'maction',
   'maligngroup',
   'malignmark',
   'math',
   'menclose',
   'merror',
   'mfenced',
   'mfrac',
   'mglyph',
   'mi',
   'mlabeledtr',
   'mline',
   'mlongdiv',
   'mmultiscripts',
   'mn',
   'mo',
   'mover',
   'mpadded',
   'mphantom',
   'mroot',
   'mrow',
   'ms',
   'mscarries',
   'mscarry',
   'msgroup',
   'mspace',
   'msqrt',
   'msrow',
   'mstack',
   'mstyle',
   'msub',
   'msubsup',
   'msup',
   'mtable',
   'mtd',
   'mtext',
   'mtr',
   'munder',
   'munderover',
   'semantics'
];

/**
 * Reserved html names.
 */
const RESERVED = [
   'invisible-node'
];

/**
 * Namespace of processing element.
 */
export const enum ElementNS {

   /**
    * Unknown element namespace.
    */
   NS_UNKNOWN = 0,

   /**
    * HTML elements namespace.
    */
   NS_HTML = 1,

   /**
    * SVG elements namespace.
    */
   NS_SVG = 2,

   /**
    * MathML elements namespace.
    */
   NS_MATHML = 4
}

/**
 * Check node name is valid html element name and known for browsers.
 * @param name {string} Element name.
 * @param elementNs {ElementNS} Current element namespace. Default value is NS_UNKNOWN.
 */
export function isElementNode(name: string, elementNs: ElementNS = ElementNS.NS_UNKNOWN): boolean {
   if (HTML_NODES.indexOf(name) > -1 && (elementNs === ElementNS.NS_HTML || elementNs === ElementNS.NS_UNKNOWN)) {
      return true;
   }
   if (SVG_NODES.indexOf(name) > -1 && (elementNs === ElementNS.NS_SVG || elementNs === ElementNS.NS_UNKNOWN)) {
      return true;
   }
   if (MATHML_NODES.indexOf(name) > -1 && (elementNs === ElementNS.NS_MATHML || elementNs === ElementNS.NS_UNKNOWN)) {
      return true;
   }
   return RESERVED.indexOf(name) > -1;
}
