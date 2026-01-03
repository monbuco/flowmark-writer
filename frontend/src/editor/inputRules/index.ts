import { Plugin } from "prosemirror-state";
import { inputRules } from "prosemirror-inputrules";
import { Schema } from "prosemirror-model";
import { buildMarkdownInputRules } from "./markdown";
import { buildFlowMarkInputRules } from "./flowmark";

export interface InputRulesOptions {
  /** Enable Markdown input rules */
  markdown?: boolean;
  /** Enable FlowMark input rules */
  flowmark?: boolean;
}

/**
 * Builds and composes input rules based on enabled language features.
 * 
 * IMPORTANT: These input rules are ONLY for direct typing in the editor.
 * For paste operations, use the Markdown parser in clipboard/markdownParser.ts instead.
 * 
 * This separation is critical for performance:
 * - Input rules: Fast, lightweight, triggered on each keystroke during typing
 * - Markdown parser: More robust, handles complex structures, used only on paste/import
 * 
 * This function combines Markdown and FlowMark input rules into a single
 * ProseMirror plugin. Rules are kept separate by language to maintain
 * clean architecture and allow for future extensibility.
 * 
 * @param schema - The ProseMirror schema
 * @param options - Configuration options for which rules to enable
 * @returns A ProseMirror plugin containing the composed input rules
 * 
 * @example
 * ```typescript
 * // Enable only Markdown rules
 * const plugin = buildInputRules(schema, { markdown: true, flowmark: false });
 * 
 * // Enable both Markdown and FlowMark rules
 * const plugin = buildInputRules(schema, { markdown: true, flowmark: true });
 * ```
 */
export function buildInputRules(
  schema: Schema,
  options: InputRulesOptions = { markdown: true, flowmark: false }
): Plugin {
  const rules: any[] = [];

  // Add Markdown rules if enabled
  if (options.markdown) {
    rules.push(...buildMarkdownInputRules(schema));
  }

  // Add FlowMark rules if enabled
  if (options.flowmark) {
    rules.push(...buildFlowMarkInputRules(schema));
  }

  // Return a ProseMirror plugin with all composed rules
  return inputRules({ rules });
}

