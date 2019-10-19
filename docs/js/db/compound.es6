window.db.tableDefs.compounds = window.db.compounds = _.merge({

  columns: {
    identifiers: {primaryKey: true, dataType: 'array'},
    names:       {notNull: true, dataType: 'array'},
    functions:   {dataType: 'array'},
    pubchem_cid: {dataType: 'number'},
    references: {dataType: 'array'},
  },

}, db.tableInterface)

