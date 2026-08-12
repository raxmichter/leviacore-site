/**
 * Mobile nav drawer — must be an external module so CSP script-src 'self' allows it.
 * (Inline <script> in SiteHeader is blocked by vercel.json Content-Security-Policy.)
 */
function wireMobileMenu() {
  const toggle = document.getElementById('mobile-menu-toggle')
  const menu = document.getElementById('mobile-menu')
  if (!(toggle instanceof HTMLElement) || !(menu instanceof HTMLElement)) return
  if (toggle.dataset.wired === '1') return
  toggle.dataset.wired = '1'

  const firstLink = () => menu.querySelector<HTMLElement>('a, button')

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open))
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
    toggle.classList.toggle('is-active', open)
    document.documentElement.classList.toggle('menu-open', open)
    document.body.classList.toggle('menu-open', open)
    if (open) {
      menu.removeAttribute('hidden')
      requestAnimationFrame(() => {
        firstLink()?.focus()
      })
    } else {
      menu.setAttribute('hidden', '')
      toggle.focus()
    }
  }

  toggle.addEventListener('click', (event) => {
    event.stopPropagation()
    setOpen(menu.hasAttribute('hidden'))
  })

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return
    if (menu.hasAttribute('hidden')) return
    event.preventDefault()
    setOpen(false)
  })

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false))
  })
}

wireMobileMenu()
document.addEventListener('astro:page-load', wireMobileMenu)
