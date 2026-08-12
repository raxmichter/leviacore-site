declare global {
  interface Window {
    dataLayer: unknown[]
  }
}
window.dataLayer = window.dataLayer || []
function gtag() {
  // GA expects the Arguments object, not a rest-array wrapper.
  window.dataLayer.push(arguments)
}
gtag('set', 'developer_id.dZGVlNj', true)
gtag('js', new Date())
gtag('config', 'G-EG4F7ZLTZQ')
export {}
