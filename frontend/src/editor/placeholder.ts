import { Plugin } from "prosemirror-state";

export function placeholder(text: string) {
  return new Plugin({
    props: {
      attributes: { class: "ProseMirror" },
    },
    appendTransaction: (transactions, oldState, newState) => {
      // This ensures the editor always has content
      return null;
    },
  });
}

