import 'react'

// Allow CSS custom properties such as style={{ '--delay': '180ms' }}.
declare module 'react' {
  interface CSSProperties {
    [name: `--${string}`]: string | number | undefined
  }
}
