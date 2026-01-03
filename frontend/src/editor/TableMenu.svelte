<script lang="ts">
  import { EditorView } from "prosemirror-view";
  import { EditorState } from "prosemirror-state";
  import { onMount, onDestroy } from "svelte";
  import {
    Plus,
    Minus,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    Trash2,
  } from "lucide-svelte";
  import {
    addRowBeforeCommand,
    addRowAfterCommand,
    deleteRowCommand,
    addColumnBeforeCommand,
    addColumnAfterCommand,
    deleteColumnCommand,
    deleteTableCommand,
    isInTable,
  } from "./toolbar";

  let { view = $bindable(null) }: { view: EditorView | null } = $props();

  let showMenu = $state(false);
  let menuPos = $state({ top: 0, left: 0 });
  let forceUpdate = $state(0);

  function updatePosition(view: EditorView) {
    if (!view) return;

    const { state } = view;
    const { selection } = state;

    if (!isInTable(state)) {
      showMenu = false;
      return;
    }

    // Get the DOM position of the selection
    const coords = view.coordsAtPos(selection.$from.pos);
    const editorEl = view.dom;
    const editorRect = editorEl.getBoundingClientRect();
    const containerEl = editorEl.closest('.editor-container');
    const containerRect = containerEl ? containerEl.getBoundingClientRect() : editorRect;

    // Position menu above the selection, relative to the container
    menuPos = {
      top: coords.top - containerRect.top - 40,
      left: coords.left - containerRect.left,
    };

    showMenu = true;
  }

  function handleCommand(command: (view: EditorView) => boolean) {
    if (!view) return;
    command(view);
    view.focus();
    forceUpdate++;
    // Update position after command
    setTimeout(() => updatePosition(view), 10);
  }

  $effect(() => {
    if (!view) return;

    const update = () => {
      updatePosition(view);
    };

    // Listen to DOM events
    view.dom.addEventListener("selectionchange", update);
    view.dom.addEventListener("mouseup", update);
    view.dom.addEventListener("keyup", update);
    view.dom.addEventListener("focus", update);

    // Force update on next tick to ensure DOM is ready
    setTimeout(() => updatePosition(view), 0);

    return () => {
      view?.dom.removeEventListener("selectionchange", update);
      view?.dom.removeEventListener("mouseup", update);
      view?.dom.removeEventListener("keyup", update);
      view?.dom.removeEventListener("focus", update);
    };
  });

  // React to forceUpdate changes
  $effect(() => {
    if (forceUpdate && view) {
      setTimeout(() => updatePosition(view), 10);
    }
  });
</script>

{#if showMenu && view}
  <div class="table-menu" style="top: {menuPos.top}px; left: {menuPos.left}px;">
    <div class="table-menu-group">
      <span class="table-menu-label">Rows</span>
      <button
        class="table-menu-button"
        onclick={() => handleCommand(addRowBeforeCommand)}
        title="Add row before"
      >
        <ArrowUp size={14} />
      </button>
      <button
        class="table-menu-button"
        onclick={() => handleCommand(addRowAfterCommand)}
        title="Add row after"
      >
        <ArrowDown size={14} />
      </button>
      <button
        class="table-menu-button"
        onclick={() => handleCommand(deleteRowCommand)}
        title="Delete row"
      >
        <Minus size={14} />
      </button>
    </div>

    <div class="table-menu-divider"></div>

    <div class="table-menu-group">
      <span class="table-menu-label">Columns</span>
      <button
        class="table-menu-button"
        onclick={() => handleCommand(addColumnBeforeCommand)}
        title="Add column before"
      >
        <ArrowLeft size={14} />
      </button>
      <button
        class="table-menu-button"
        onclick={() => handleCommand(addColumnAfterCommand)}
        title="Add column after"
      >
        <ArrowRight size={14} />
      </button>
      <button
        class="table-menu-button"
        onclick={() => handleCommand(deleteColumnCommand)}
        title="Delete column"
      >
        <Minus size={14} />
      </button>
    </div>

    <div class="table-menu-divider"></div>

    <div class="table-menu-group">
      <button
        class="table-menu-button"
        onclick={() => handleCommand(deleteTableCommand)}
        title="Delete table"
      >
        <Trash2 size={14} />
      </button>
    </div>
  </div>
{/if}

<style>
  .table-menu {
    position: absolute;
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    padding: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 1000;
    pointer-events: auto;
    white-space: nowrap;
  }

  .table-menu-group {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .table-menu-label {
    font-size: 11px;
    color: #666;
    margin-right: 4px;
    font-weight: 500;
  }

  .table-menu-button {
    background: transparent;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 3px;
    padding: 4px 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #333;
    transition: all 0.2s;
  }

  .table-menu-button:hover {
    background: rgba(0, 0, 0, 0.05);
    border-color: rgba(0, 0, 0, 0.2);
  }

  .table-menu-button:active {
    background: rgba(0, 0, 0, 0.1);
  }

  .table-menu-divider {
    width: 1px;
    height: 24px;
    background: rgba(0, 0, 0, 0.1);
    margin: 0 4px;
  }

  .table-menu-button :global(svg) {
    stroke: currentColor;
    fill: none;
  }

  @media (prefers-color-scheme: dark) {
    .table-menu {
      background: #2a2a2a;
      border-color: rgba(255, 255, 255, 0.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .table-menu-label {
      color: #aaa;
    }

    .table-menu-button {
      border-color: rgba(255, 255, 255, 0.1);
      color: #e0e0e0;
    }

    .table-menu-button:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .table-menu-divider {
      background: rgba(255, 255, 255, 0.1);
    }
  }
</style>

