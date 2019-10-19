window.db.tableInterface = {

  async select() {
    await db.connection.select({from: this.name})
  },

  async insert(values) {
    var inserted = await db.connection.insert({
      into:   this.name, 
      values: _.castArray(values),
    })
    console.log(`${this.name}: added ${insert} records`)
  },

}
