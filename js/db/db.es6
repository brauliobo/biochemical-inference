window.db = {
  name:      'biochemical-db',
  tableDefs: {},

  connection: new JsStore.Instance(),

  init: async () => {
    db.tables = _.map(db.tableDefs, (t, n) => _.merge(t, {name: n}))
    db.isCreated = await db.connection.initDb(db)
  },
  drop: () => {
    db.connection.dropDb()
      .then(() => console.log('Db deleted successfully'))
      .catch((error) => console.log(error))
  },
}

