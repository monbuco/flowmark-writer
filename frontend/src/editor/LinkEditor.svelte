<script lang="ts">
  import { EditorView } from "prosemirror-view";
  import { EditorState } from "prosemirror-state";
  import { schema } from "./schema";
  import { getLinkUrl } from "./toolbar";

  let { view }: { view: EditorView | null } = $props();
  
  let state: EditorState | null = $state(null);

  let linkUrl = $state("");
  let linkText = $state("");
  let isVisible = $state(false);
  let position = $state({ top: 0, left: 0 });
  let showEditor = $state(false);

  function updateLinkInfo() {
    if (!view || !state) {
      isVisible = false;
      return;
    }

    const url = getLinkUrl(state);
    if (url) {
      const { from } = state.selection;
      linkUrl = url;
      
      // Get position of selection relative to editor container
      const coords = view.coordsAtPos(from);
      const editorRect = view.dom.getBoundingClientRect();
      
      if (coords) {
        position = {
          top: coords.bottom - editorRect.top + 5,
          left: coords.left - editorRect.left,
        };
        isVisible = true;
      }
    } else {
      isVisible = false;
      showEditor = false;
    }
  }

  function handleEdit() {
    showEditor = true;
  }

  function handleSave() {
    if (!view || !linkUrl.trim()) return;

    const { state, dispatch } = view;
    const { from, to } = state.selection;
    const linkMark = schema.marks.link;
    
    if (!linkMark) return;

    // Update link URL
    const mark = linkMark.create({ href: linkUrl.trim() });
    const tr = state.tr.removeMark(from, to, linkMark).addMark(from, to, mark);
    
    if (dispatch) {
      dispatch(tr);
    }
    
    showEditor = false;
    view.focus();
  }

  function handleRemove() {
    if (!view) return;

    const { state, dispatch } = view;
    const { from, to } = state.selection;
    const linkMark = schema.marks.link;
    
    if (!linkMark) return;

    const tr = state.tr.removeMark(from, to, linkMark);
    
    if (dispatch) {
      dispatch(tr);
    }
    
    isVisible = false;
    showEditor = false;
    view.focus();
  }

  function handleCancel() {
    showEditor = false;
    if (view) {
      view.focus();
    }
  }

  // Update state and link info when view changes
  $effect(() => {
    if (!view) {
      state = null;
      isVisible = false;
      return;
    }

    state = view.state;
    updateLinkInfo();

    // Set up event listeners to track state changes
    const handleUpdate = () => {
      if (view) {
        state = view.state;
        requestAnimationFrame(() => {
          updateLinkInfo();
        });
      }
    };

    const scheduleUpdate = () => {
      requestAnimationFrame(() => {
        if (view) {
          state = view.state;
          updateLinkInfo();
        }
      });
    };

    view.dom.addEventListener("selectionchange", scheduleUpdate);
    view.dom.addEventListener("mouseup", scheduleUpdate);
    view.dom.addEventListener("keyup", scheduleUpdate);
    view.dom.addEventListener("input", scheduleUpdate);

    return () => {
      view?.dom.removeEventListener("selectionchange", scheduleUpdate);
      view?.dom.removeEventListener("mouseup", scheduleUpdate);
      view?.dom.removeEventListener("keyup", scheduleUpdate);
      view?.dom.removeEventListener("input", scheduleUpdate);
    };
  });

  // Handle keyboard
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      handleCancel();
    } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSave();
    }
  }
</script>

{#if isVisible && view && state}
  <div
    class="link-editor"
    style="top: {position.top}px; left: {position.left}px;"
    role="tooltip"
  >
    {#if !showEditor}
      <div class="link-preview">
        <a href={linkUrl} target="_blank" rel="noopener noreferrer" class="link-url">
          {linkUrl}
        </a>
        <button class="link-edit-btn" onclick={handleEdit} title="Edit link">
          ✏️
        </button>
        <button class="link-remove-btn" onclick={handleRemove} title="Remove link">
          ✕
        </button>
      </div>
    {:else}
      <div class="link-editor-form">
        <input
          type="text"
          bind:value={linkUrl}
          placeholder="Enter URL"
          class="link-input"
          onkeydown={handleKeydown}
          autofocus
        />
        <div class="link-actions">
          <button class="link-save-btn" onclick={handleSave} title="Save (Ctrl+Enter)">
            Save
          </button>
          <button class="link-cancel-btn" onclick={handleCancel} title="Cancel (Esc)">
            Cancel
          </button>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .link-editor {
    position: absolute;
    z-index: 1000;
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    padding: 8px;
    font-size: 14px;
    min-width: 200px;
    max-width: 400px;
  }

  .link-preview {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .link-url {
    flex: 1;
    color: #0066cc;
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }

  .link-url:hover {
    text-decoration: underline;
  }

  .link-edit-btn,
  .link-remove-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px 6px;
    font-size: 14px;
    border-radius: 3px;
    transition: background-color 0.1s;
  }

  .link-edit-btn:hover,
  .link-remove-btn:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .link-editor-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .link-input {
    padding: 6px 8px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    font-size: 13px;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .link-input:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
  }

  .link-actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
  }

  .link-save-btn,
  .link-cancel-btn {
    padding: 4px 12px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 12px;
    transition: background-color 0.1s;
  }

  .link-save-btn {
    background: #0066cc;
    color: white;
    border-color: #0066cc;
  }

  .link-save-btn:hover {
    background: #0052a3;
  }

  .link-cancel-btn:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  @media (prefers-color-scheme: dark) {
    .link-editor {
      background: #1a1a1a;
      border-color: rgba(255, 255, 255, 0.1);
    }

    .link-url {
      color: #4a9eff;
    }

    .link-input {
      background: #2a2a2a;
      border-color: rgba(255, 255, 255, 0.2);
      color: #e0e0e0;
    }

    .link-save-btn {
      background: #4a9eff;
      border-color: #4a9eff;
    }

    .link-save-btn:hover {
      background: #3a8eef;
    }

    .link-cancel-btn {
      background: #2a2a2a;
      color: #e0e0e0;
      border-color: rgba(255, 255, 255, 0.2);
    }
  }
</style>

