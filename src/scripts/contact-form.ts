/** Contact form AJAX — external module for CSP script-src 'self'. */
function wireContactForms() {
    document.querySelectorAll('[data-contact-form]').forEach((wrapper) => {
      const form = wrapper.querySelector('form')
      const success = wrapper.querySelector('.form-message-success')
      const error = wrapper.querySelector('.form-message-error')
      const submit = wrapper.querySelector('.submit-button')
      if (!(form instanceof HTMLFormElement) || !success || !error || !submit) return
      if (form.dataset.wired === '1') return
      form.dataset.wired = '1'

      form.addEventListener('submit', async (event) => {
        event.preventDefault()
        success.hidden = true
        error.hidden = true

        const honey = form.querySelector('input[name="_gotcha"]')
        if (honey instanceof HTMLInputElement && honey.value.trim() !== '') {
          success.hidden = false
          form.hidden = true
          return
        }

        const previousLabel = submit.textContent
        submit.setAttribute('disabled', 'true')
        submit.textContent = 'Sending…'

        try {
          const body = new FormData(form)
          const response = await fetch(form.action, {
            method: 'POST',
            body,
            headers: { Accept: 'application/json' },
          })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const payload = await response.json().catch(() => ({}))
          if (payload.success === 'false' || payload.error) throw new Error(payload.message || 'submit failed')
          form.hidden = true
          success.hidden = false
        } catch {
          error.hidden = false
          submit.removeAttribute('disabled')
          submit.textContent = previousLabel || 'Submit'
        }
      })
    })
  }

  wireContactForms()
  document.addEventListener('astro:page-load', wireContactForms)
