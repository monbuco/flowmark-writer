import { inputRules } from "prosemirror-inputrules";
import {
  wrappingInputRule,
  textblockTypeInputRule,
  smartQuotes,
  ellipsis,
  emDash,
} from "prosemirror-inputrules";
import { Schema } from "prosemirror-model";

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
        /^\s*([-+*])\s$/,
        schema.nodes.bullet_list
      )
    );
  }

  rules.push(...smartQuotes, ellipsis, emDash);

  return inputRules({ rules });
}
