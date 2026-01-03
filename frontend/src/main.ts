import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import "prosemirror-view/style/prosemirror.css"
import "prosemirror-tables/style/tables.css"


const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
