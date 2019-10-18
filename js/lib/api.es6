
window.api = {

  call: (url, {body = null, method = 'GET'} = {}) => {
    return api.fetchRetry(url, {method: method, body: body})
      .then((response) => {
        return response.json()
      })
  },

  fetchRetry: (url, options, retries = 3) =>
    fetch(url, options)
    .then((response) => {
      if (!response.ok) throw new Error(`Got ${response.status}`);
      return response
    })
    .catch((error) => {
      if (retries === 1) {
        console.log(`Call to ${url} failed`)
        throw error
      }
      return api.fetchRetry(url, options, retries - 1)
    })
}

