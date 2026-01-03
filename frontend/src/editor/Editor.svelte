<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { EditorState } from "prosemirror-state";
    import { EditorView } from "prosemirror-view";
    import { keymap } from "prosemirror-keymap";
    import { baseKeymap } from "prosemirror-commands";
    import { history } from "prosemirror-history";
  
    import { schema } from "./schema";
    import { buildInputRules } from "./inputRules";
  
    let editorEl: HTMLDivElement;
    let view: EditorView | null = null;
  
    onMount(() => {
      if (!editorEl) {
        console.error("Editor element not found");
        return;
      }
      
      try {
        // Create initial document with empty paragraph
        const doc = schema.nodes.doc.create(
          {},
          schema.nodes.paragraph.create()
        );
        
        const state = EditorState.create({
          doc,
          schema,
          plugins: [
            buildInputRules(schema),
            keymap(baseKeymap),
            history(),
          ],
        });
  
        view = new EditorView(editorEl, {
          state,
        });

        // Ensure the editor container is visible
        if (editorEl) {
          editorEl.style.display = "block";
          editorEl.style.visibility = "visible";
        }

        // Focus the editor after a short delay to ensure it's rendered
        setTimeout(() => {
          if (view) {
            view.focus();
          }
        }, 100);

        console.log("ProseMirror editor initialized successfully", {
          editorEl,
          view,
          dom: view?.dom,
        });
      } catch (error) {
        console.error("Error initializing ProseMirror editor:", error);
      }
    });

    onDestroy(() => {
      if (view) {
        view.destroy();
        view = null;
      }
    });
  </script>
  
  <div class="editor-wrapper">
    <div class="editor">
      <div bind:this={editorEl} class="editor-container"></div>
    </div>
  </div>
  
  
<style>
.editor-wrapper {
  width: 100%;
  min-height: 100vh;
  background-color: #ffffff;
  color: #000000;
}

.editor {
  max-width: 816px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 96px 96px 96px 96px;
  background-color: #ffffff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.editor-container {
  min-height: 400px;
  width: 100%;
  position: relative;
  display: block;
}

:global(.editor-container > .ProseMirror) {
  min-height: 400px;
  padding: 0;
  outline: none;
  cursor: text;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 16px;
  line-height: 1.6;
  color: #000000;
  background-color: #ffffff;
  display: block;
  width: 100%;
}

:global(.editor-container .ProseMirror:focus) {
  outline: none;
}

:global(.editor-container .ProseMirror p) {
  margin: 0;
  padding: 0;
  min-height: 1.6em;
}

:global(.editor-container .ProseMirror p.is-empty::before) {
  content: attr(data-placeholder);
  float: left;
  color: #999;
  pointer-events: none;
  height: 0;
}

:global(.editor-container .ProseMirror h1),
:global(.editor-container .ProseMirror h2),
:global(.editor-container .ProseMirror h3),
:global(.editor-container .ProseMirror h4),
:global(.editor-container .ProseMirror h5),
:global(.editor-container .ProseMirror h6) {
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

:global(.editor-container .ProseMirror h1) {
  font-size: 2em;
}

:global(.editor-container .ProseMirror h2) {
  font-size: 1.5em;
}

:global(.editor-container .ProseMirror h3) {
  font-size: 1.25em;
}

:global(.editor-container .ProseMirror ul),
:global(.editor-container .ProseMirror ol) {
  padding-left: 2em;
  margin: 0.5em 0;
}

:global(.editor-container .ProseMirror li) {
  margin: 0.25em 0;
}

@media (prefers-color-scheme: dark) {
  .editor-wrapper {
    background-color: #1a1a1a;
  }
  
  .editor {
    background-color: #1a1a1a;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
  }
  
  :global(.editor-container .ProseMirror) {
    color: #e0e0e0;
    background-color: #1a1a1a;
  }
}
</style>
  