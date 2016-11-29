const { handleActions } = require('./handle-actions')
const { deepEqual } = require('assert')
const { call } = require('./actions')
const { stub } = require('sinon')

describe('handle-actions.js', () => {
  describe('handleActions', () => {
    it('should throw an exception if plugin is not registered', async () => {
      const noop = function () {}
      const handlers = {}
      const actions = [{type: 'dne'}]
      try {
        await handleActions(noop, handlers, actions)
      } catch (e) {
        deepEqual(e.error.message, '"dne" is not a registered plugin.')
        return
      }
      fail('handleActions did not throw')
    })

    it('run a fn for the call action', async () => {
      let fn = function * () {}
      let a = call(fn, {foo: 'bar'})
      let run = (handlers, fn, payload) => {
        return {
          handlers,
          fn,
          payload
        }
      }

      let results = await handleActions(run, {}, [a])
      deepEqual(results.length, 1)
      deepEqual(results[0].payload, {
        handlers: {},
        payload: {foo: 'bar'},
        fn
      })
    })

    it('should use the call action handler is provided', async () => {
      let fn = function * () {}
      let a = call(fn, {foo: 'bar'})
      let callHandler = stub().returns(true)
      const handlers = {
        call: callHandler
      }

      let results = await handleActions(() => {}, handlers, [a])
      deepEqual(results.length, 1)
      deepEqual(results[0].payload, true)
      deepEqual(callHandler.firstCall.args[0], {
        type: 'call',
        payload: {foo: 'bar'},
        fn
      })
    })

    it('should normalize results to success objects', async () => {
      const a = {
        type: 'test'
      }
      const handlers = {
        test: 'foo'
      }
      const run = () => {}
      let results = await handleActions(run, handlers, [a])
      deepEqual(results[0], {
        success: true,
        payload: 'foo'
      })
    })

    it('should support handlers as functions returning values', async () => {
      const a = {
        type: 'test'
      }
      const handlers = {
        test: () => 'foo'
      }
      const run = () => {}
      let results = await handleActions(run, handlers, [a])
      deepEqual(results[0].payload, 'foo')
    })

    it('should support handlers returning promises', async () => {
      const a = {
        type: 'test'
      }
      const handlers = {
        test: () => Promise.resolve('foo')
      }
      const run = () => {}
      let results = await handleActions(run, handlers, [a])
      deepEqual(results[0].payload, 'foo')
    })

    it('should support handlers returning values', async () => {
      const a = {
        type: 'test'
      }
      const handlers = {
        test: 'foo'
      }
      const run = () => {}
      let results = await handleActions(run, handlers, [a])
      deepEqual(results[0].payload, 'foo')
    })

    it('should handle promise rejections and return a failure object', async () => {
      const a = {
        type: 'test'
      }
      const error = new Error('nope')
      const handlers = {
        test: Promise.reject(error)
      }
      const run = () => {}
      let results = await handleActions(run, handlers, [a])
      deepEqual(results, [{
        success: false,
        error
      }])
    })
  })
})