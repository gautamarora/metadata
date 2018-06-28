const regex = /\n\n<!-- probot = (.*) -->/

module.exports = (context, issue = null) => {
  const github = context.github
  let prefix = process.env.APP_ID
  const oldPrefix = context.payload.installation.id

  if (!issue) issue = context.issue()

  return {
    async get (key = null) {
      let body = issue.body

      if (!body) {
        body = (await github.issues.get(issue)).data.body
      }

      const match = body.match(regex)

      if (match) {
        const json = JSON.parse(match[1])
        const data = json[prefix] || json[oldPrefix]
        return key ? data && data[key] : data
      }
    },

    async set (key, value) {
      let body = issue.body
      let data = {}

      if (!body) body = (await github.issues.get(issue)).data.body

      body = body.replace(regex, (_, json) => {
        data = JSON.parse(json)
        return ''
      })

      if (!prefix) {
        prefix = oldPrefix
      }
      if (!data[prefix]) data[prefix] = {}

      if (typeof key === 'object') {
        Object.assign(data[prefix], key)
      } else {
        data[prefix][key] = value
      }

      body = `${body}\n\n<!-- probot = ${JSON.stringify(data)} -->`

      const {owner, repo, number} = issue
      return github.issues.edit({owner, repo, number, body})
    }
  }
}
