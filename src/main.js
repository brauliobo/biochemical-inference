import { createVaporApp } from 'vue'
import App from './App.vue'
import { installLegacyInterop } from './vapor-interop.js'
import './styles/index.css'

// The whole app runs in Vapor mode.
const app = createVaporApp(App)
installLegacyInterop(app) // temporary, see src/vapor-interop.js
app.mount('#app')
