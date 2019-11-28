"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var SuperagentJSONP =
/*#__PURE__*/
function () {
  function SuperagentJSONP(request) {
    var _this = this;

    var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var callbackFunction = arguments.length > 2 ? arguments[2] : undefined;

    _classCallCheck(this, SuperagentJSONP);

    this.callbackParam = config.callbackParam || 'callback';
    this.callbackName = config.callbackName || "superagentCallback".concat(new Date().valueOf() + parseInt(Math.random() * 1000, 10));
    this.timeout = config.timeout || 1000;
    this.callbackFunction = callbackFunction;
    this.timeoutTask = setTimeout(function () {
      var timeoutError = new Error('timeout');

      _this.errorWrapper(timeoutError);

      console.info('settimeout');
    }, this.timeout);
    window[this.callbackName] = this.callbackWrapper.bind(this); // eslint-disable-next-line no-underscore-dangle

    request._query.push("".concat(encodeURIComponent(this.callbackParam), "=").concat(encodeURIComponent(this.callbackName))); // eslint-disable-next-line no-underscore-dangle


    var queryString = request._query.join('&');

    var script = document.createElement('script');
    {
      var separator = request.url.indexOf('?') > -1 ? '&' : '?';
      var url = request.url + separator + queryString;
      script.src = url; // Handle script load error #27

      script.onerror = function (e) {
        console.info('onerror');

        _this.errorWrapper(e);
      };
    }
    document.head.appendChild(script);
    this.script = script;
    this.request = request;
    request.superagentJSONP = this;
  }

  _createClass(SuperagentJSONP, [{
    key: "callbackWrapper",
    value: function callbackWrapper(body) {
      var err = null;
      var res = {
        body: body
      };
      this.removeCallback();
      this.callbackFunction.call(this.request, err, res);
    }
  }, {
    key: "errorWrapper",
    value: function errorWrapper(error) {
      var err = error || new Error('404 Not found');
      this.callbackFunction.call(this.request, err, null);
    }
  }, {
    key: "removeCallback",
    value: function removeCallback() {
      clearTimeout(this.timeoutTask); // clear timeout (for onerror event listener)

      if (this.script && this.script.parentNode) {
        this.script.parentNode.removeChild(this.script);
      }

      delete window[this.callbackName];
    }
  }]);

  return SuperagentJSONP;
}();

var jsonp = function jsonp(requestOrConfig) {
  var end = function end() {
    var pluginConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return function handler(callback) {
      // eslint-disable-next-line no-unused-vars
      var plugin = new SuperagentJSONP(this, pluginConfig, callback);
      return this;
    };
  };

  var reqFunc = function reqFunc(request) {
    // In case this is in nodejs, run without modifying request
    if (typeof window === 'undefined') return request;
    request.end = end.call(request, requestOrConfig);
    return request;
  }; // if requestOrConfig is request


  if (typeof requestOrConfig.end === 'function') {
    return reqFunc(requestOrConfig);
  }

  return reqFunc;
}; // Prefer node/browserify style requires


if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = jsonp;
} else if (typeof define === 'function' && define.amd) {
  define([], function () {
    return {
      jsonp: jsonp
    };
  });
} else if (typeof window !== 'undefined') {
  window.superagentJSONP = jsonp;
}