class SuperagentJSONP {
  constructor(request, config = {}, callbackFunction) {
    this.callbackParam = config.callbackParam || 'callback';
    this.callbackName = config.callbackName || `superagentCallback${new Date().valueOf() + parseInt(Math.random() * 1000, 10)}`;
    this.timeout = config.timeout || 1000;
    this.callbackFunction = callbackFunction;

    this.timeoutTask = setTimeout(() => {
      const timeoutError = new Error('timeout');
      this.errorWrapper(timeoutError);
      console.info('settimeout');
    }, this.timeout);

    window[this.callbackName] = this.callbackWrapper.bind(this);

    // eslint-disable-next-line no-underscore-dangle
    request._query.push(`${encodeURIComponent(this.callbackParam)}=${encodeURIComponent(this.callbackName)}`);
    // eslint-disable-next-line no-underscore-dangle
    const queryString = request._query.join('&');

    const script = document.createElement('script');
    {
      const separator = (request.url.indexOf('?') > -1) ? '&' : '?';
      const url = request.url + separator + queryString;

      script.src = url;

      // Handle script load error #27
      script.onerror = (e) => {
        console.info('onerror');
        this.errorWrapper(e);
      };
    }

    document.head.appendChild(script);
    this.script = script;

    this.request = request;
    request.superagentJSONP = this;
  }

  callbackWrapper(body) {
    const err = null;
    const res = { body };

    this.removeCallback();

    this.callbackFunction.call(this.request, err, res);
  }

  errorWrapper(error) {
    const err = error || new Error('404 Not found');

    this.callbackFunction.call(this.request, err, null);
  }

  removeCallback() {
    clearTimeout(this.timeoutTask); // clear timeout (for onerror event listener)

    if (this.script && this.script.parentNode) {
      this.script.parentNode.removeChild(this.script);
    }

    delete window[this.callbackName];
  }
}

const jsonp = function (requestOrConfig) {
  const end = function (pluginConfig = {}) {
    return function handler(callback) {
      // eslint-disable-next-line no-unused-vars
      const plugin = new SuperagentJSONP(this, pluginConfig, callback);

      return this;
    };
  };

  const reqFunc = function (request) {
    // In case this is in nodejs, run without modifying request
    if (typeof window === 'undefined') return request;

    request.end = end.call(request, requestOrConfig);
    return request;
  };

  // if requestOrConfig is request
  if (typeof requestOrConfig.end === 'function') {
    return reqFunc(requestOrConfig);
  }

  return reqFunc;
};

// Prefer node/browserify style requires
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = jsonp;
} else if (typeof define === 'function' && define.amd) {
  define([], () => ({ jsonp }));
} else if (typeof window !== 'undefined') {
  window.superagentJSONP = jsonp;
}
