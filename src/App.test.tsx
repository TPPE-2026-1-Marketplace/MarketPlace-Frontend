import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the hello world heading', () => {
    const html = renderToString(<App />)

    expect(html).toContain('Hello, World')
  })
})
