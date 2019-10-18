window.github = window.gh = {

  source: {
    owner:  'brauliobo',
    repo:   'biochemical-db',
    branch: 'master',
  },

  ls: async (path, opts = {}) => {
    return gh.tree({path: path}).then((json) => {
      return _.filter(json.tree, (f) => {
        return f.type != 'tree' && _.startsWith(f.path, path)
      })
    })
  },

  file: (path, {owner = gh.source.owner, repo = gh.source.repo, sha = gh.source.branch} = {}) => {
    return fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${sha}/${path}`).then((r) => r.text().then((o) => o))
  },

  tree: ({owner = gh.source.owner, repo = gh.source.repo, sha = gh.source.branch, recursive = true, path = '/'} = {}) => {
    return gh.call(`repos/${owner}/${repo}/git/trees/${sha}`, {params: {recursive: recursive}})
  },

  call: (path, {params = {}} = {}) => {
    var url = `https://api.github.com/${path}?${w.url.objectToQuery(params)}`
    return api.call(url)
  },

}
