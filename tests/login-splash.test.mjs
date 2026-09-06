import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { transformWithOxc } from 'vite'

async function setup({ routeKey = 'menu', loading = false } = {}) {
  const source = await readFile('src/context/LoginSplashContext.jsx', 'utf8')
  const { code } = await transformWithOxc(source, 'LoginSplashContext.jsx')
  const frames = new Map()
  const timers = new Map()
  const updates = []
  let id = 0
  let stateIndex = 0
  let effect
  let fades = 0
  const context = vm.createContext({
    requestAnimationFrame: callback => { frames.set(++id, callback); return id },
    cancelAnimationFrame: key => frames.delete(key),
    window: {
      setTimeout: (callback, delay) => { timers.set(++id, { callback, delay }); return id },
      clearTimeout: key => timers.delete(key),
    },
  })
  const dependencies = {
    react: {
      createContext: () => ({ Provider: 'provider' }),
      useContext: () => null,
      useEffect: callback => { effect = callback },
      useRef: () => ({ current: { fadeOut: async () => { fades++ } } }),
      useState: () => [stateIndex++ === 0 ? true : 'login', value => updates.push(value)],
    },
    'react-router-dom': {
      useLocation: () => ({ key: routeKey }),
      useNavigate: () => () => {},
    },
    '../components/AuthSplash': { default: () => null },
    './PageLoadingContext': { usePageLoading: () => ({ isPageLoading: loading }) },
    'react/jsx-runtime': { jsx: () => null, jsxs: () => null },
  }
  const module = new vm.SourceTextModule(code, { context })
  await module.link(specifier => {
    const exports = dependencies[specifier]
    return new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value)
    }, { context })
  })
  await module.evaluate()
  module.namespace.LoginSplashProvider({ children: null })
  const cleanup = effect()
  const paint = () => {
    const callbacks = [...frames.values()]
    frames.clear()
    callbacks.forEach(callback => callback())
  }
  return { frames, timers, updates, paint, cleanup, fades: () => fades }
}

test('login splash stays visible while the login route is still committed', async () => {
  const state = await setup({ routeKey: 'login' })
  assert.equal(state.frames.size, 0)
  assert.equal(state.fades(), 0)
})

test('login splash waits while the destination loading UI is active', async () => {
  const state = await setup({ loading: true })
  assert.equal(state.frames.size, 0)
  assert.equal(state.fades(), 0)
})

test('destination paints and stays behind splash before the fast fade starts', async () => {
  const state = await setup()
  state.paint()
  assert.equal(state.timers.size, 0)
  state.paint()
  assert.equal(state.fades(), 0)
  const [timer] = state.timers.values()
  assert.equal(timer.delay, 400)
  await timer.callback()
  assert.equal(state.fades(), 1)
  assert.deepEqual(state.updates, [false, null])
})

test('a route or loading change cancels a pending splash dismissal', async () => {
  const state = await setup()
  state.paint()
  state.paint()
  const [timer] = state.timers.values()
  state.cleanup()
  assert.equal(state.timers.size, 0)
  await timer.callback()
  assert.equal(state.fades(), 0)
  assert.deepEqual(state.updates, [])
})
