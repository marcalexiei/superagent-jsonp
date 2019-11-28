// TODO: Move all of this setup into test helper
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { JSDOM } from 'jsdom';
import sinon from 'sinon';

import jsonp from '../src/superagent-jsonp';

chai.use(sinonChai);

function generateDOM() {
  const myPage = new JSDOM('<html><body></body></html>');
  global.window = myPage.window;
  global.document = myPage.window.document;
  global.navigator = {
    userAgent: 'node.js',
  };
}

function tearDownDOM() {
  delete global.window;
  delete global.document;
  delete global.navigator;
}

describe('SuperagentJSONP', function () {
  const sandbox = sinon.createSandbox({
    properties: ['spy', 'clock'],
    useFakeTimers: true,
    useFakeServer: true,
  });

  afterEach(function () {
    sandbox.restore();
  });

  const end = 'Hello ';
  const requestMock = { end };

  context('when window is not defined', function () {
    it('does nothing', function () {
      expect(jsonp({})('hello')).to.eq('hello');
    });
  });

  context('when window is defined', function () {
    beforeEach(generateDOM);
    afterEach(tearDownDOM);

    it('sets up the request object', function () {
      const newRequest = jsonp({})(requestMock);
      expect(newRequest.end).not.to.eq(end);
      expect(typeof newRequest.end).to.eq('function');
    });
  });

  context('when the url returns a 404', function () {
    const createRequestMock = function () {
      return {
        _query: [],
        url: 'http://test.com',
      };
    };

    beforeEach(generateDOM);
    afterEach(tearDownDOM);

    it('calls the error handler', function () {
      const testErrorCb = function testErrorCb() {
        console.info('argh');
      };

      const spy = sinon.spy(testErrorCb);

      jsonp({ timeout: 100 })(createRequestMock()).end(testErrorCb);

      sandbox.clock.tick(110);

      expect(spy).to.have.been.called; // eslint-disable-line no-unused-expressions
      expect(spy).to.have.been.calledWith(new Error('404 NotFound'), null);
    });

    it('script and window callback are correctly removed', function () {
      const callbackName = 'testErrorCb';
      jsonp({ timeout: 100, callbackName })(createRequestMock()).end(() => {});

      sandbox.clock.tick(150);

      expect(typeof window[callbackName]).to.eq('undefined');
      expect(document.querySelectorAll('script').length).to.eq(0);
    });
  });
});
