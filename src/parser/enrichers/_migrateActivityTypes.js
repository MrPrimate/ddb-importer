#!/usr/bin/env node
// One-off migration script: replace string literals in get type() methods
// with DDBEnricherData.ACTIVITY_TYPES.<KEY> references.

const { readFileSync, writeFileSync, readdirSync, statSync } = require("fs");
const { join } = require("path");

const REPLACEMENTS = [
  [/"attack"/g, "DDBEnricherData.ACTIVITY_TYPES.ATTACK"],
  [/"cast"/g, "DDBEnricherData.ACTIVITY_TYPES.CAST"],
  [/"check"/g, "DDBEnricherData.ACTIVITY_TYPES.CHECK"],
  [/"damage"/g, "DDBEnricherData.ACTIVITY_TYPES.DAMAGE"],
  [/"enchant"/g, "DDBEnricherData.ACTIVITY_TYPES.ENCHANT"],
  [/"forward"/g, "DDBEnricherData.ACTIVITY_TYPES.FORWARD"],
  [/"heal"/g, "DDBEnricherData.ACTIVITY_TYPES.HEAL"],
  [/"none"/g, "DDBEnricherData.ACTIVITY_TYPES.NONE"],
  [/"order"/g, "DDBEnricherData.ACTIVITY_TYPES.ORDER"],
  [/"save"/g, "DDBEnricherData.ACTIVITY_TYPES.SAVE"],
  [/"summon"/g, "DDBEnricherData.ACTIVITY_TYPES.SUMMON"],
  [/"transform"/g, "DDBEnricherData.ACTIVITY_TYPES.TRANSFORM"],
  [/"utility"/g, "DDBEnricherData.ACTIVITY_TYPES.UTILITY"],
  [/"ddbmacro"/g, "DDBEnricherData.ACTIVITY_TYPES.DDBMACRO"],
];

// Matches a get type() block (single brace depth, no nested braces)
const TYPE_METHOD_RE = /(get\s+type\s*\(\s*\)\s*(?::\s*\S+\s*)?\{[^}]*\})/g;

function walkDir(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walkDir(full));
    } else if (full.endsWith(".ts")) {
      results.push(full);
    }
  }
  return results;
}

const files = walkDir("src/parser/enrichers");
let changedCount = 0;

for (const file of files) {
  const original = readFileSync(file, "utf8");

  const updated = original.replace(TYPE_METHOD_RE, (block) => {
    let result = block;
    for (const [pattern, replacement] of REPLACEMENTS) {
      result = result.replace(pattern, replacement);
    }
    return result;
  });

  if (updated !== original) {
    writeFileSync(file, updated, "utf8");
    changedCount++;
  }
}

console.log(`Done. Modified ${changedCount} files.`);
