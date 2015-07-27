;(function() {

var define, requireModule, require, requirejs;

(function() {

  var _isArray;
  if (!Array.isArray) {
    _isArray = function (x) {
      return Object.prototype.toString.call(x) === "[object Array]";
    };
  } else {
    _isArray = Array.isArray;
  }

  var registry = {}, seen = {};
  var FAILED = false;

  var uuid = 0;

  function tryFinally(tryable, finalizer) {
    try {
      return tryable();
    } finally {
      finalizer();
    }
  }

  function unsupportedModule(length) {
    throw new Error("an unsupported module was defined, expected `define(name, deps, module)` instead got: `" + length + "` arguments to define`");
  }

  var defaultDeps = ['require', 'exports', 'module'];

  function Module(name, deps, callback, exports) {
    this.id       = uuid++;
    this.name     = name;
    this.deps     = !deps.length && callback.length ? defaultDeps : deps;
    this.exports  = exports || { };
    this.callback = callback;
    this.state    = undefined;
    this._require  = undefined;
  }


  Module.prototype.makeRequire = function() {
    var name = this.name;

    return this._require || (this._require = function(dep) {
      return require(resolve(dep, name));
    });
  }

  define = function(name, deps, callback) {
    if (arguments.length < 2) {
      unsupportedModule(arguments.length);
    }

    if (!_isArray(deps)) {
      callback = deps;
      deps     =  [];
    }

    registry[name] = new Module(name, deps, callback);
  };

  // we don't support all of AMD
  // define.amd = {};
  // we will support petals...
  define.petal = { };

  function Alias(path) {
    this.name = path;
  }

  define.alias = function(path) {
    return new Alias(path);
  };

  function reify(mod, name, seen) {
    var deps = mod.deps;
    var length = deps.length;
    var reified = new Array(length);
    var dep;
    // TODO: new Module
    // TODO: seen refactor
    var module = { };

    for (var i = 0, l = length; i < l; i++) {
      dep = deps[i];
      if (dep === 'exports') {
        module.exports = reified[i] = seen;
      } else if (dep === 'require') {
        reified[i] = mod.makeRequire();
      } else if (dep === 'module') {
        mod.exports = seen;
        module = reified[i] = mod;
      } else {
        reified[i] = requireFrom(resolve(dep, name), name);
      }
    }

    return {
      deps: reified,
      module: module
    };
  }

  function requireFrom(name, origin) {
    var mod = registry[name];
    if (!mod) {
      throw new Error('Could not find module `' + name + '` imported from `' + origin + '`');
    }
    return require(name);
  }

  function missingModule(name) {
    throw new Error('Could not find module ' + name);
  }
  requirejs = require = requireModule = function(name) {
    var mod = registry[name];


    if (mod && mod.callback instanceof Alias) {
      mod = registry[mod.callback.name];
    }

    if (!mod) { missingModule(name); }

    if (mod.state !== FAILED &&
        seen.hasOwnProperty(name)) {
      return seen[name];
    }

    var reified;
    var module;
    var loaded = false;

    seen[name] = { }; // placeholder for run-time cycles

    tryFinally(function() {
      reified = reify(mod, name, seen[name]);
      module = mod.callback.apply(this, reified.deps);
      loaded = true;
    }, function() {
      if (!loaded) {
        mod.state = FAILED;
      }
    });

    var obj;
    if (module === undefined && reified.module.exports) {
      obj = reified.module.exports;
    } else {
      obj = seen[name] = module;
    }

    if (obj !== null &&
        (typeof obj === 'object' || typeof obj === 'function') &&
          obj['default'] === undefined) {
      obj['default'] = obj;
    }

    return (seen[name] = obj);
  };

  function resolve(child, name) {
    if (child.charAt(0) !== '.') { return child; }

    var parts = child.split('/');
    var nameParts = name.split('/');
    var parentBase = nameParts.slice(0, -1);

    for (var i = 0, l = parts.length; i < l; i++) {
      var part = parts[i];

      if (part === '..') {
        if (parentBase.length === 0) {
          throw new Error('Cannot access parent module of root');
        }
        parentBase.pop();
      } else if (part === '.') { continue; }
      else { parentBase.push(part); }
    }

    return parentBase.join('/');
  }

  requirejs.entries = requirejs._eak_seen = registry;
  requirejs.clear = function(){
    requirejs.entries = requirejs._eak_seen = registry = {};
    seen = state = {};
  };
})();

define('mobiledoc-html-renderer/html-renderer', ['exports', 'mobiledoc-html-renderer/utils/dom'], function (exports, _mobiledocHtmlRendererUtilsDom) {
  /**
   * runtime HTML renderer
   * renders a mobiledoc to HTML
   *
   * input: mobiledoc
   * output: HTML
   */

  'use strict';

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function createElementFromMarkerType() {
    var _ref = arguments[0] === undefined ? ['', []] : arguments[0];

    var _ref2 = _slicedToArray(_ref, 2);

    var tagName = _ref2[0];
    var attributes = _ref2[1];

    var element = _mobiledocHtmlRendererUtilsDom['default'].createElement(tagName);
    attributes = attributes || [];

    for (var i = 0, l = attributes.length; i < l; i = i + 2) {
      var propName = attributes[i],
          propValue = attributes[i + 1];
      _mobiledocHtmlRendererUtilsDom['default'].setAttribute(element, propName, propValue);
    }
    return element;
  }

  var DOMRenderer = (function () {
    function DOMRenderer() {
      _classCallCheck(this, DOMRenderer);
    }

    _createClass(DOMRenderer, [{
      key: 'render',

      /**
       * @param mobiledoc
       * @param rootElement optional, defaults to an empty div
       * @return DOMNode
       */
      value: function render(mobiledoc) {
        var _this = this;

        var rootElement = arguments[1] === undefined ? _mobiledocHtmlRendererUtilsDom['default'].createElement('div') : arguments[1];

        var _mobiledoc = _slicedToArray(mobiledoc, 2);

        var markerTypes = _mobiledoc[0];
        var sections = _mobiledoc[1];

        this.root = rootElement;
        this.markerTypes = markerTypes;

        sections.forEach(function (section) {
          return _this.renderSection(section);
        });

        return this.root.toString();
      }
    }, {
      key: 'renderSection',
      value: function renderSection(section) {
        var _section = _slicedToArray(section, 1);

        var type = _section[0];

        switch (type) {
          case 1:
            var rendered = this.renderParagraphSection(section);
            _mobiledocHtmlRendererUtilsDom['default'].appendChild(this.root, rendered);
            break;
          default:
            throw new Error('Unimplement renderer for type ' + type);
        }
      }
    }, {
      key: 'renderParagraphSection',
      value: function renderParagraphSection(_ref3) {
        var _ref32 = _slicedToArray(_ref3, 3);

        var type = _ref32[0];
        var tagName = _ref32[1];
        var markers = _ref32[2];

        var element = _mobiledocHtmlRendererUtilsDom['default'].createElement(tagName);
        var elements = [element];
        var currentElement = element;

        for (var i = 0, l = markers.length; i < l; i++) {
          var marker = markers[i];

          var _marker = _slicedToArray(marker, 3);

          var openTypes = _marker[0];
          var closeTypes = _marker[1];
          var text = _marker[2];

          for (var j = 0, m = openTypes.length; j < m; j++) {
            var markerType = this.markerTypes[openTypes[j]];
            var openedElement = createElementFromMarkerType(markerType);
            _mobiledocHtmlRendererUtilsDom['default'].appendChild(currentElement, openedElement);
            elements.push(openedElement);
            currentElement = openedElement;
          }

          _mobiledocHtmlRendererUtilsDom['default'].appendChild(currentElement, _mobiledocHtmlRendererUtilsDom['default'].createTextNode(text));

          for (var j = 0, m = closeTypes; j < m; j++) {
            elements.pop();
            currentElement = elements[elements.length - 1];
          }
        }

        return element;
      }
    }]);

    return DOMRenderer;
  })();

  exports['default'] = DOMRenderer;
});
define('mobiledoc-html-renderer', ['exports', 'mobiledoc-html-renderer/html-renderer'], function (exports, _mobiledocHtmlRendererHtmlRenderer) {
  'use strict';

  exports.registerGlobal = registerGlobal;

  function registerGlobal(window) {
    window.MobiledocHTMLRenderer = _mobiledocHtmlRendererHtmlRenderer['default'];
  }

  exports['default'] = _mobiledocHtmlRendererHtmlRenderer['default'];
});
define("mobiledoc-html-renderer/utils/dom", ["exports"], function (exports) {
  "use strict";

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var Element = (function () {
    function Element(tagName) {
      _classCallCheck(this, Element);

      this.tagName = tagName.toLowerCase();
      this.childNodes = [];
      this.attributes = [];
    }

    _createClass(Element, [{
      key: "appendChild",
      value: function appendChild(element) {
        this.childNodes.push(element);
      }
    }, {
      key: "setAttribute",
      value: function setAttribute(propName, propValue) {
        this.attributes.push(propName, propValue);
      }
    }, {
      key: "toString",
      value: function toString() {
        var html = "<" + this.tagName;

        if (this.attributes.length) {
          for (var i = 0; i < this.attributes.length; i = i + 2) {
            var propName = this.attributes[i],
                propValue = this.attributes[i + 1];
            html += " " + propName + "=\"" + propValue + "\"";
          }
        }
        html += ">";

        for (var i = 0; i < this.childNodes.length; i++) {
          html += this.childNodes[i].toString();
        }
        html += "</" + this.tagName + ">";
        return html;
      }
    }]);

    return Element;
  })();

  var TextNode = (function () {
    function TextNode(value) {
      _classCallCheck(this, TextNode);

      this.value = value;
    }

    _createClass(TextNode, [{
      key: "toString",
      value: function toString() {
        return this.value;
      }
    }]);

    return TextNode;
  })();

  var Document = (function () {
    function Document() {
      _classCallCheck(this, Document);
    }

    _createClass(Document, [{
      key: "createElement",
      value: function createElement(tagName) {
        return new Element(tagName);
      }
    }, {
      key: "createTextNode",
      value: function createTextNode(text) {
        return new TextNode(text);
      }
    }]);

    return Document;
  })();

  var doc = new Document();

  exports["default"] = {
    createElement: function createElement(tagName) {
      return doc.createElement(tagName);
    },
    appendChild: function appendChild(target, child) {
      target.appendChild(child);
    },
    createTextNode: function createTextNode(text) {
      return doc.createTextNode(text);
    },
    setAttribute: function setAttribute(element, propName, propValue) {
      element.setAttribute(propName, propValue);
    }
  };
});
require("mobiledoc-html-renderer")["registerGlobal"](window, document);
})();