// Pressure v2.0.0 | Created By Stuart Yamartino | MIT License | 2015 - Present
;(function(window, document) {
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//--------------------- Public API Section ---------------------//
// this is the Pressure Object, this is the only object that is accessible to the end user
// only the methods in this object can be called, making it the "public api"
var Pressure = {

  // targets any device with Force or 3D Touch

  set: function set(selector, closure, options) {
    loopPressureElements(selector, closure, options);
  },


  // set configuration options for global config
  config: function config(options) {
    Config.set(options);
  },


  // the map method allows for interpolating a value from one range of values to another
  // example from the Arduino documentation: https://www.arduino.cc/en/Reference/Map
  map: function map(x, in_min, in_max, out_min, out_max) {
    return _map(x, in_min, in_max, out_min, out_max);
  }
};

// Assign the Pressure object to the global object (or module for npm) so it can be called from inside the self executing anonymous function
if (window !== false) {
  // if Pressure is not defined, it is the jquery.pressure library and skip the next setup
  if (typeof Pressure !== "undefined") {
    // this if block came from: http://ifandelse.com/its-not-hard-making-your-library-support-amd-and-commonjs/
    if (typeof define === "function" && define.amd) {
      // Now we're wrapping the factory and assigning the return
      // value to the root (window) and returning it as well to
      // the AMD loader.
      var pressure = Pressure;
      define(["pressure"], function (Pressure) {
        return Pressure;
      });
    } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && module.exports) {
      // I've not encountered a need for this yet, since I haven't
      // run into a scenario where plain modules depend on CommonJS
      // *and* I happen to be loading in a CJS browser environment
      // but I'm including it for the sake of being thorough
      var pressure = Pressure;
      module.exports = pressure;
    } else {
      window.Pressure = Pressure;
    }
  }
} else {
  console.warn("Pressure requires a window with a document");
  // I can't put 'return' here because babel blows up when it is compiled with gulp
  // because it is not in a function. It is only put into the iife when gulp runs.
  // The next line is replaced with 'return;' when gulp runs.
  return;
}

var Element = function () {
  function Element(element, block, options) {
    _classCallCheck(this, Element);

    this.el = element;
    this.block = block;
    this.options = options;
    this.type = Config.get('only', options);
    this.routeEvents();
    this.preventSelect();
    this.polyfill = new AdapterPolyfill(this);
    this.pressed = false;
    this.deepPressed = false;
  }

  _createClass(Element, [{
    key: "routeEvents",
    value: function routeEvents() {
      var _this = this;

      // if on desktop and requesting Force Touch or not requesting 3D Touch
      if (isDesktop && (this.type === 'desktop' || this.type !== 'mobile')) {
        new AdapterForceTouch(this);
      }
      // if on mobile and requesting 3D Touch or not requestion Force Touch
      else if (isMobile && (this.type === 'mobile' || this.type !== 'desktop')) {
          new Adapter3DTouch(this);
        }
        // unsupported if it is requesting a type and your browser is of other type
        else {
            this.el.addEventListener(isMobile ? 'touchstart' : 'mousedown', function (event) {
              return _this.runClosure('unsupported', event);
            }, false);
          }
    }
  }, {
    key: "failOrPolyfill",
    value: function failOrPolyfill(event) {
      // is the polyfill option set
      if (Config.get('polyfill', this.options)) {
        this.polyfill.runEvent(event);
      } else {
        this.runClosure('unsupported', event);
      }
    }

    // run the closure if the property exists in the object

  }, {
    key: "runClosure",
    value: function runClosure(method) {
      if (this.block.hasOwnProperty(method)) {
        // call the closure method and apply nth arguments if they exist
        this.block[method].apply(this.el || this, Array.prototype.slice.call(arguments, 1));
      }
    }

    // prevent the default action of text selection, "peak & pop", and force touch special feature

  }, {
    key: "preventSelect",
    value: function preventSelect() {
      if (Config.get('preventSelect', this.options)) {
        this.el.style.webkitTouchCallout = "none";
        this.el.style.webkitUserSelect = "none";
        this.el.style.khtmlUserSelect = "none";
        this.el.style.MozUserSelect = "none";
        this.el.style.msUserSelect = "none";
        this.el.style.userSelect = "none";
      }
    }
  }]);

  return Element;
}();

/*
This is the base adapter from which all the other adapters extend.
*/

var Adapter = function () {
  function Adapter(element) {
    _classCallCheck(this, Adapter);

    this.element = element;
    this.el = element.el;
    this.block = element.block;
    this.runClosure = element.runClosure;
  }

  _createClass(Adapter, [{
    key: "add",
    value: function add(event, set) {
      this.el.addEventListener(event, set, false);
    }
  }, {
    key: "setPressed",
    value: function setPressed(boolean) {
      this.element.pressed = boolean;
    }
  }, {
    key: "setDeepPressed",
    value: function setDeepPressed(boolean) {
      this.element.deepPressed = boolean;
    }
  }, {
    key: "isPressed",
    value: function isPressed() {
      return this.element.pressed;
    }
  }, {
    key: "isDeepPressed",
    value: function isDeepPressed() {
      return this.element.deepPressed;
    }
  }, {
    key: "_support",
    value: function _support(event) {
      console.log(this.isPressed(), 2);
      if (this.isPressed() === false) {
        this.element.failOrPolyfill(event);
      }
    }
  }, {
    key: "_startPress",
    value: function _startPress(event) {
      console.log(this.isPressed(), 1);
      if (this.isPressed() === false) {
        this.setPressed(true);
        this.runClosure('start', event);
      }
    }
  }, {
    key: "_startDeepPress",
    value: function _startDeepPress(event) {
      if (this.isPressed() && this.isDeepPressed() === false) {
        this.setDeepPressed(true);
        this.runClosure('startDeepPress', event);
      }
    }
  }, {
    key: "_endDeepPress",
    value: function _endDeepPress() {
      if (this.isPressed() && this.isDeepPressed()) {
        this.setDeepPressed(false);
        this.runClosure('endDeepPress');
      }
    }
  }, {
    key: "_endPress",
    value: function _endPress() {
      if (this.isPressed()) {
        this._endDeepPress();
        this.setPressed(false);
        this.runClosure('end');
        this.element.polyfill.force = 0;
      }
    }
  }]);

  return Adapter;
}();

/*
This adapter is for Macs with Force Touch trackpads.
*/

var AdapterForceTouch = function (_Adapter) {
  _inherits(AdapterForceTouch, _Adapter);

  function AdapterForceTouch(element) {
    _classCallCheck(this, AdapterForceTouch);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(AdapterForceTouch).call(this, element));

    _this2.bindEvents();
    return _this2;
  }

  _createClass(AdapterForceTouch, [{
    key: "bindEvents",
    value: function bindEvents() {
      this.add('webkitmouseforcewillbegin', this._startPress.bind(this));
      this.add('mousedown', this._support.bind(this));
      this.add('webkitmouseforcechanged', this.change.bind(this));
      this.add('webkitmouseforcedown', this._startDeepPress.bind(this));
      this.add('webkitmouseforceup', this._endDeepPress.bind(this));
      this.add('mouseleave', this._endPress.bind(this));
      this.add('mouseup', this._endPress.bind(this));
    }
  }, {
    key: "change",
    value: function change(event) {
      if (this.isPressed() && event.webkitForce > 0) {
        this.runClosure('change', this.normalizeForce(event.webkitForce), event);
      }
    }

    // make the force the standard 0 to 1 scale and not the 1 to 3 scale

  }, {
    key: "normalizeForce",
    value: function normalizeForce(force) {
      return this.reachOne(_map(force, 1, 3, 0, 1));
    }

    // if the force value is above 0.999 set the force to 1

  }, {
    key: "reachOne",
    value: function reachOne(force) {
      return force > 0.999 ? 1 : force;
    }
  }]);

  return AdapterForceTouch;
}(Adapter);

/*
This adapter is more mobile devices that support 3D Touch.
*/

var Adapter3DTouch = function (_Adapter2) {
  _inherits(Adapter3DTouch, _Adapter2);

  function Adapter3DTouch(element) {
    _classCallCheck(this, Adapter3DTouch);

    var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(Adapter3DTouch).call(this, element));

    _this3.bindEvents();
    return _this3;
  }

  _createClass(Adapter3DTouch, [{
    key: "bindEvents",
    value: function bindEvents() {
      if (supportsTouchForceChange) {
        this.add('touchforcechange', this.start.bind(this));
        this.add('touchstart', this.support.bind(this, 0));
        this.add('touchend', this._endPress.bind(this));
      } else {
        this.add('touchstart', this.startLegacyPress.bind(this));
        this.add('touchend', this._endPress.bind(this));
      }
    }
  }, {
    key: "support",
    value: function support(iter, event) {
      if (this.isPressed() === false) {
        if (iter > 10) {
          this.element.failOrPolyfill(event);
        } else {
          iter++;
          setTimeout(this.support.bind(this), 10, iter, event);
        }
      }
    }
  }, {
    key: "start",
    value: function start(event) {
      if (event.touches.length > 0) {
        this._startPress(event);
        this.runClosure('change', this.selectTouch(event).force, event);
      }
    }
  }, {
    key: "startLegacyPress",
    value: function startLegacyPress() {
      this.forceValueTest = event.touches[0].force;
      this.supportLegacyPress(0, event);
    }
  }, {
    key: "supportLegacyPress",
    value: function supportLegacyPress(iter, event) {
      // this checks up to 10 times on a touch to see if the touch can read a force value
      // if the force value has changed it means the device supports pressure
      // more info from this issue https://github.com/yamartino/pressure/issues/15
      if (event.touches[0].force !== this.forceValueTest) {
        this._startPress(event);
        this.loopForce(event);
      } else if (iter <= 10) {
        iter++;
        setTimeout(this.supportLegacyPress.bind(this), 10, iter, event);
      } else {
        this.element.failOrPolyfill(event);
      }
    }
  }, {
    key: "loopForce",
    value: function loopForce(event) {
      if (this.isPressed()) {
        this.touch = this.selectTouch(event);
        setTimeout(this.loopForce.bind(this, event), 10);
        this.runClosure('change', this.touch.force, event);
      }
    }

    // link up the touch point to the correct element, this is to support multitouch

  }, {
    key: "selectTouch",
    value: function selectTouch(event) {
      if (event.touches.length === 1) {
        return this.returnTouch(event.touches[0], event);
      } else {
        for (var i = 0; i < event.touches.length; i++) {
          // if the target press is on this element
          if (event.touches[i].target === this.el) {
            return this.returnTouch(event.touches[i], event);
          }
        }
      }
    }

    // return the touch and run a start or end for deep press

  }, {
    key: "returnTouch",
    value: function returnTouch(touch, event) {
      touch.force >= 0.5 ? this._startDeepPress(event) : this._endDeepPress();
      return touch;
    }
  }]);

  return Adapter3DTouch;
}(Adapter);

/*
This adapter is for devices that don't have Force Touch or 3D Touch
support and have the 'polyfill' option turned on.
*/

var AdapterPolyfill = function (_Adapter3) {
  _inherits(AdapterPolyfill, _Adapter3);

  function AdapterPolyfill(element) {
    _classCallCheck(this, AdapterPolyfill);

    var _this4 = _possibleConstructorReturn(this, Object.getPrototypeOf(AdapterPolyfill).call(this, element, 0));

    _this4.increment = 10 / Config.get('polyfillSpeed', element.options);
    _this4.force = 0;
    return _this4;
  }

  _createClass(AdapterPolyfill, [{
    key: "runEvent",
    value: function runEvent(event) {
      this._startPress(event);
      this.loopForce(event);
    }
  }, {
    key: "loopForce",
    value: function loopForce(event) {
      if (this.isPressed()) {
        this.runClosure('change', this.force, event);
        this.force >= 0.5 ? this._startDeepPress(event) : this._endDeepPress();
        this.force = this.force + this.increment > 1 ? 1 : this.force + this.increment;
        setTimeout(this.loopForce.bind(this), 10, event);
      }
    }
  }]);

  return AdapterPolyfill;
}(Adapter);

// This class holds the states of the the Pressure config


var Config = {

  // 'true' prevents the selecting of text and images via css properties
  preventSelect: true,

  // 'mobile' or 'desktop' will make it run only on that type of device
  only: null,

  // 'true' will make polyfill run when pressure is not supported
  polyfill: false,

  // milliseconds it takes to go from 0 to 1 for the polyfill
  polyfillSpeed: 1000,

  // this will get the correct config / option settings for the current pressure check
  get: function get(option, options) {
    return options.hasOwnProperty(option) ? options[option] : this[option];
  },


  // this will set the global configs
  set: function set(options) {
    for (var k in options) {
      if (options.hasOwnProperty(k) && this.hasOwnProperty(k) && k != 'get' && k != 'set') {
        this[k] = options[k];
      }
    }
  }
};

//------------------- Helpers -------------------//

// accepts jQuery object, node list, string selector, then called a setup for each element
var loopPressureElements = function loopPressureElements(selector, closure) {
  var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  // if a string is passed in as an element
  if (typeof selector === 'string' || selector instanceof String) {
    var elements = document.querySelectorAll(selector);
    for (var i = 0; i < elements.length; i++) {
      new Element(elements[i], closure, options);
    }
    // if a single element object is passed in
  } else if (isElement(selector)) {
      new Element(selector, closure, options);
      // if a node list is passed in ex. jQuery $() object
    } else {
        for (var i = 0; i < selector.length; i++) {
          new Element(selector[i], closure, options);
        }
      }
};

//Returns true if it is a DOM element
var isElement = function isElement(o) {
  return (typeof HTMLElement === "undefined" ? "undefined" : _typeof(HTMLElement)) === "object" ? o instanceof HTMLElement : //DOM2
  o && (typeof o === "undefined" ? "undefined" : _typeof(o)) === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName === "string";
};

// the map method allows for interpolating a value from one range of values to another
// example from the Arduino documentation: https://www.arduino.cc/en/Reference/Map
var _map = function _map(x, in_min, in_max, out_min, out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

// check if device is desktop device
var isDesktop = 'ontouchstart' in document === false;

// check if device is regular mobile device
var isMobile = 'ontouchstart' in document === true;

// check if device is an Apple iOS 10+ device
var supportsTouchForceChange = 'ontouchforcechange' in document;
}(typeof window !== "undefined" ? window : false, typeof window !== "undefined" ? window.document : false));
