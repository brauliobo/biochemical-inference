window.db.tableInterface = {
  async select() {
    return await db.connection.select({from: this.name})
  },
}
