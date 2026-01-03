<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { EditorState } from "prosemirror-state";
    import { EditorView } from "prosemirror-view";
    import { keymap } from "prosemirror-keymap";
    import { baseKeymap, toggleMark } from "prosemirror-commands";
    import { history, undo, redo } from "prosemirror-history";
    import { columnResizing, tableEditing } from "prosemirror-tables";
    import { TextSelection } from "prosemirror-state";
    import { Fragment } from "prosemirror-model";
  
    import { schema } from "./schema";
    import { buildInputRules } from "./inputRules";
    import Toolbar from "./Toolbar.svelte";
    import LinkEditor from "./LinkEditor.svelte";
    import TableMenu from "./TableMenu.svelte";
  
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
        
        // Custom keyboard shortcuts for bold, italic, undo, and redo
        const customKeymap = {
          "Mod-b": toggleMark(schema.marks.strong),
          "Mod-i": toggleMark(schema.marks.em),
          "Mod-z": undo,
          "Mod-y": redo,
          "Shift-Mod-z": redo,
          // Handle Enter key
          "Enter": (state: EditorState, dispatch: any) => {
            const { $from } = state.selection;
            
            // Check if current line is "---" and convert to horizontal rule
            const lineStart = $from.start($from.depth);
            const lineEnd = $from.end($from.depth);
            const lineText = state.doc.textBetween(lineStart, lineEnd).trim();
            
            if (lineText === "---" && schema.nodes.horizontal_rule) {
              // Find the paragraph node that contains "---"
              const paragraphNode = $from.node($from.depth);
              if (paragraphNode.type === schema.nodes.paragraph) {
                const hr = schema.nodes.horizontal_rule.create();
                const newParagraph = schema.nodes.paragraph.create();
                // Replace the entire paragraph node with horizontal rule and new paragraph
                // We need to replace from before the paragraph to after it
                const paragraphStart = $from.before($from.depth);
                const paragraphEnd = $from.after($from.depth);
                // Create fragment with horizontal rule and new paragraph
                const fragment = Fragment.fromArray([hr, newParagraph]);
                const tr = state.tr.replaceWith(paragraphStart, paragraphEnd, fragment);
                // Position cursor at the start of the new paragraph
                const updatedDoc = tr.doc;
                // Find where the horizontal rule ends
                const hrNode = updatedDoc.nodeAt(paragraphStart);
                if (hrNode && hrNode.type === schema.nodes.horizontal_rule) {
                  const hrEnd = paragraphStart + hrNode.nodeSize;
                  const cursorPos = hrEnd + 1;
                  tr.setSelection(TextSelection.near(updatedDoc.resolve(cursorPos)));
                }
                if (dispatch) dispatch(tr);
                return true;
              }
            }
            
            // Find table node
            let tablePos = -1;
            let tableNode = null;
            for (let d = $from.depth; d > 0; d--) {
              const node = $from.node(d);
              if (node.type === schema.nodes.table) {
                tablePos = $from.before(d);
                tableNode = node;
                break;
              }
            }
            
            if (tableNode && tablePos >= 0) {
              const tableEnd = tablePos + tableNode.nodeSize;
              // Check if cursor is near the end of the table
              if ($from.pos >= tableEnd - 5) {
                // Check if there's already a paragraph after the table
                const nextNode = state.doc.nodeAt(tableEnd);
                if (!nextNode || nextNode.type !== schema.nodes.paragraph) {
                  // Create a new paragraph after the table
                  const paragraph = schema.nodes.paragraph.create();
                  const tr = state.tr.insert(tableEnd, paragraph);
                  tr.setSelection(TextSelection.near(tr.doc.resolve(tableEnd + 1)));
                  if (dispatch) dispatch(tr);
                  return true;
                } else {
                  // Move to the existing paragraph
                  const tr = state.tr.setSelection(TextSelection.near(state.doc.resolve(tableEnd + 1)));
                  if (dispatch) dispatch(tr);
                  return true;
                }
              }
            }
            return false; // Let default behavior handle it
          },
          // Handle ArrowDown at the end of a table
          "ArrowDown": (state: EditorState, dispatch: any) => {
            const { $from } = state.selection;
            // Find table node
            let tablePos = -1;
            let tableNode = null;
            for (let d = $from.depth; d > 0; d--) {
              const node = $from.node(d);
              if (node.type === schema.nodes.table) {
                tablePos = $from.before(d);
                tableNode = node;
                break;
              }
            }
            
            if (tableNode && tablePos >= 0) {
              const tableEnd = tablePos + tableNode.nodeSize;
              // Check if cursor is near the end of the table
              if ($from.pos >= tableEnd - 5) {
                // Check if there's a paragraph after the table
                const nextNode = state.doc.nodeAt(tableEnd);
                if (nextNode && nextNode.type === schema.nodes.paragraph) {
                  // Move to the paragraph after the table
                  const tr = state.tr.setSelection(TextSelection.near(state.doc.resolve(tableEnd + 1)));
                  if (dispatch) dispatch(tr);
                  return true;
                } else {
                  // Create a new paragraph after the table
                  const paragraph = schema.nodes.paragraph.create();
                  const tr = state.tr.insert(tableEnd, paragraph);
                  tr.setSelection(TextSelection.near(tr.doc.resolve(tableEnd + 1)));
                  if (dispatch) dispatch(tr);
                  return true;
                }
              }
            }
            return false; // Let default behavior handle it
          },
        };

        const state = EditorState.create({
          doc,
          schema,
          plugins: [
            buildInputRules(schema),
            keymap(customKeymap),
            keymap(baseKeymap),
            history(),
            columnResizing(),
            tableEditing(),
          ],
        });
  
        view = new EditorView(editorEl, {
          state,
          handleDOMEvents: {
            click: (view, event) => {
              // Prevent default link navigation - allow editing instead
              const target = event.target as HTMLElement;
              if (target.tagName === 'A') {
                event.preventDefault();
                // Focus the editor to allow editing
                view.focus();
                return true;
              }
              return false;
            },
            mousemove: (view, event) => {
              // Update state on mouse move to detect link hover
              const target = event.target as HTMLElement;
              if (target.tagName === 'A') {
                // Trigger state update to show link editor
                return false;
              }
              return false;
            },
          },
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
      <Toolbar {view} />
      <div bind:this={editorEl} class="editor-container">
        {#if view}
          <LinkEditor {view} />
          <TableMenu {view} />
        {/if}
      </div>
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

:global(.editor-container .ProseMirror hr) {
  border: none;
  border-top: 2px solid rgba(0, 0, 0, 0.1);
  margin: 2em 0;
}

:global(.editor-container .ProseMirror a) {
  color: #0066cc;
  text-decoration: underline;
  cursor: pointer;
}

:global(.editor-container .ProseMirror a:hover) {
  color: #0052a3;
  text-decoration: underline;
}

:global(.editor-container .ProseMirror table) {
  border-collapse: collapse;
  margin: 1em 0;
  width: 100%;
}

:global(.editor-container .ProseMirror table td),
:global(.editor-container .ProseMirror table th) {
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 8px 12px;
  min-width: 100px;
}

:global(.editor-container .ProseMirror table th) {
  background-color: rgba(0, 0, 0, 0.05);
  font-weight: 600;
}

:global(.editor-container .ProseMirror table .selectedCell) {
  background-color: rgba(0, 102, 204, 0.1);
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
  