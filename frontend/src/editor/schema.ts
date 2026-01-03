import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { tableNodes } from "prosemirror-tables";

const tableNodesSpec = tableNodes({
  tableGroup: "block",
  cellContent: "block+",
  cellAttributes: {},
});

// Add code_block node if it doesn't exist in basicSchema
const codeBlockSpec = basicSchema.spec.nodes.get("code_block") || {
  content: "text*",
  marks: "",
  group: "block",
  code: true,
  defining: true,
  attrs: {
    language: { default: null },
  },
  parseDOM: [
    {
      tag: "pre",
      preserveWhitespace: "full",
      getAttrs: (node: any) => {
        const code = node.querySelector("code");
        return {
          language: code?.getAttribute("class")?.replace(/^language-/, "") || null,
        };
      },
    },
  ],
  toDOM: (node: any) => {
    const attrs: any = {};
    if (node.attrs.language) {
      attrs.class = `language-${node.attrs.language}`;
    }
    return ["pre", attrs, ["code", attrs, 0]];
  },
};

// Combine all nodes
const allNodes = addListNodes(
  basicSchema.spec.nodes.append(tableNodesSpec).addToEnd("code_block", codeBlockSpec),
  "paragraph block*",
  "block"
);

export const schema = new Schema({
  nodes: allNodes,
  marks: basicSchema.spec.marks,
});
