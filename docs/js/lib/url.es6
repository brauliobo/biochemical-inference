window.url = {

  addParams: (params) => {
    return url.for(window.location.pathname, _.merge({}, w.params, params))
  },
  setParams: (params) => {
    return url.for(window.location.pathname, params)
  },

  params: Qs.parse(window.location.search.slice(1)),
  objectToQuery: (obj) => Qs.stringify(obj, {
    indices: false, arrayFormat: 'comma'
  }),

}


