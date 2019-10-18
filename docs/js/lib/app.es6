window.app = {

  load: async () => {
    await riot.compile()
    riot.mount('biochemical-inference')
  },

}
window.w = window

