/**
 * ProseMirror → Markdown serializer
 * 
 * Converts ProseMirror document nodes to Markdown text.
 * Used for explicit "Copy as Markdown" action.
 */

import { Node as ProseMirrorNode, Fragment } from "prosemirror-model";
import { Schema } from "prosemirror-model";

/**
 * Serializes a ProseMirror node or fragment to Markdown
 */
export function serializeToMarkdown(node: ProseMirrorNode | Fragment, schema: Schema): string {
  if (node instanceof Fragment) {
    return serializeFragment(node, schema);
  }
  return serializeNode(node, schema);
}

/**
 * Serializes a ProseMirror node to Markdown
 */
function serializeNode(node: ProseMirrorNode, schema: Schema): string {
  const nodeType = node.type.name;
  
  switch (nodeType) {
    case "doc":
      return serializeFragment(node.content, schema);
    
    case "paragraph":
      return serializeInline(node.content, schema) + "\n\n";
    
    case "heading":
      const level = node.attrs.level || 1;
      const headingText = serializeInline(node.content, schema);
      return "#".repeat(level) + " " + headingText + "\n\n";
    
    case "code_block":
      const code = node.textContent;
      const language = node.attrs.language || "";
      return "```" + language + "\n" + code + "\n```\n\n";
    
    case "blockquote":
      const quoteContent = serializeFragment(node.content, schema);
      return quoteContent
        .split("\n")
        .filter(line => line.trim())
        .map(line => "> " + line)
        .join("\n") + "\n\n";
    
    case "horizontal_rule":
      return "---\n\n";
    
    case "bullet_list":
      return serializeList(node.content, schema, false) + "\n";
    
    case "ordered_list":
      return serializeList(node.content, schema, true) + "\n";
    
    case "list_item":
      return serializeFragment(node.content, schema);
    
    case "table":
      return serializeTable(node, schema) + "\n\n";
    
    default:
      // Fallback: serialize content
      return serializeFragment(node.content, schema);
  }
}

/**
 * Serializes a fragment (collection of nodes)
 */
function serializeFragment(fragment: Fragment, schema: Schema): string {
  let result = "";
  fragment.forEach((node) => {
    result += serializeNode(node, schema);
  });
  return result;
}

/**
 * Serializes inline content (text with marks)
 */
function serializeInline(fragment: Fragment, schema: Schema): string {
  let result = "";
  let currentMarks: any[] = [];
  
  fragment.forEach((node, offset, index) => {
    if (node.isText) {
      let text = node.text || "";
      
      // Apply marks in order
      const marks = node.marks || [];
      
      // Handle code mark (inline code)
      if (marks.find(m => m.type.name === "code")) {
        text = "`" + text + "`";
      }
      
      // Handle strong (bold)
      if (marks.find(m => m.type.name === "strong")) {
        text = "**" + text + "**";
      }
      
      // Handle em (italic) - must come after strong to avoid conflicts
      if (marks.find(m => m.type.name === "em")) {
        // Check if already wrapped in **
        if (!text.startsWith("**")) {
          text = "*" + text + "*";
        }
      }
      
      // Handle link
      const linkMark = marks.find(m => m.type.name === "link");
      if (linkMark) {
        const url = linkMark.attrs.href || "";
        text = "[" + text + "](" + url + ")";
      }
      
      result += text;
    } else {
      // Handle inline nodes like images
      if (node.type.name === "image") {
        const src = node.attrs.src || "";
        const alt = node.attrs.alt || "";
        result += "![" + alt + "](" + src + ")";
      } else {
        // Fallback: serialize content
        result += serializeFragment(node.content, schema);
      }
    }
  });
  
  return result;
}

/**
 * Serializes a list (bullet or ordered)
 */
function serializeList(fragment: Fragment, schema: Schema, ordered: boolean): string {
  let result = "";
  let itemNumber = 1;
  
  fragment.forEach((node) => {
    if (node.type.name === "list_item") {
      const prefix = ordered ? `${itemNumber}. ` : "- ";
      const content = serializeFragment(node.content, schema).trim();
      // Split into lines and indent continuation lines
      const lines = content.split("\n");
      result += prefix + lines[0] + "\n";
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          // Indent continuation lines
          result += "  " + lines[i] + "\n";
        } else {
          result += "\n";
        }
      }
      if (ordered) itemNumber++;
    } else {
      // Handle nested lists
      result += serializeNode(node, schema);
    }
  });
  
  return result;
}

/**
 * Serializes a table to Markdown
 */
function serializeTable(node: ProseMirrorNode, schema: Schema): string {
  let result = "";
  const rows: string[][] = [];
  
  // Collect all rows
  node.content.forEach((rowNode) => {
    if (rowNode.type.name === "table_row") {
      const cells: string[] = [];
      rowNode.content.forEach((cellNode) => {
        const cellText = serializeFragment(cellNode.content, schema).trim();
        cells.push(cellText);
      });
      rows.push(cells);
    }
  });
  
  if (rows.length === 0) return "";
  
  // First row is header (if using table_header)
  // For now, treat first row as header
  const headerRow = rows[0];
  result += "| " + headerRow.join(" | ") + " |\n";
  
  // Separator
  result += "| " + headerRow.map(() => "---").join(" | ") + " |\n";
  
  // Data rows
  for (let i = 1; i < rows.length; i++) {
    result += "| " + rows[i].join(" | ") + " |\n";
  }
  
  return result.trim();
}

