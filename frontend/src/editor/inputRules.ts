import { inputRules, InputRule } from "prosemirror-inputrules";
import {
  wrappingInputRule,
  textblockTypeInputRule,
  smartQuotes,
  ellipsis,
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

  // Horizontal rule is now handled by Enter key handler in Editor.svelte
  // (Removed input rule to allow typing --- without space, then pressing Enter)

  // Add other rules (emDash removed to allow --- for horizontal rule)
  rules.push(...smartQuotes, ellipsis);

  return inputRules({ rules });
}
