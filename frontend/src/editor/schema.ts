import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { tableNodes } from "prosemirror-tables";

const tableNodesSpec = tableNodes({
  tableGroup: "block",
  cellContent: "block+",
  cellAttributes: {},
});

export const schema = new Schema({
  nodes: addListNodes(
    basicSchema.spec.nodes.append(tableNodesSpec),
    "paragraph block*",
    "block"
  ),
  marks: basicSchema.spec.marks,
});
