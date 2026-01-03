import { inputRules, InputRule } from "prosemirror-inputrules";
import {
  wrappingInputRule,
  textblockTypeInputRule,
  smartQuotes,
  ellipsis,
  emDash,
} from "prosemirror-inputrules";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";

export function buildInputRules(schema: Schema) {
  const rules = [];

  if (schema.nodes.heading) {
    rules.push(
      textblockTypeInputRule(
        /^(#{1,6})\s$/,
        schema.nodes.heading,
        match => ({ level: match[1].length })
      )
    );
  }

  if (schema.nodes.bullet_list) {
    rules.push(
      wrappingInputRule(
        /^([-+*])\s$/,
        schema.nodes.bullet_list
      )
    );
  }

  if (schema.nodes.ordered_list) {
    rules.push(
      wrappingInputRule(
        /^(\d+)\.\s$/,
        schema.nodes.ordered_list
      )
    );
  }

  // Horizontal rule: ---
  if (schema.nodes.horizontal_rule) {
    rules.push(
      new InputRule(/^---$/, (state: EditorState, match: RegExpMatchArray, start: number, end: number) => {
        const { tr } = state;
        const hr = schema.nodes.horizontal_rule.create();
        return tr.replaceWith(start, end, hr);
      })
    );
  }

  rules.push(...smartQuotes, ellipsis, emDash);

  return inputRules({ rules });
}
