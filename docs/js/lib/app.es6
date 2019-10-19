window.app = {

  load: async () => {
    await riot.compile()
    riot.mount('biochemical-inference')
    db.init()
  },

}
window.w = window

