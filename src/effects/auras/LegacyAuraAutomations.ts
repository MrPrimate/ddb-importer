import { logger } from "../../lib/_module";

/**
 * Entry points for documents imported before region automation replaced the
 * Active Auras harness. Cloudkill, Create Bonfire, Grease, Web and similar
 * spells imported on those versions still carry midi onUse flags, DAE macro
 * changes and OverTime `macro=function.` references naming these functions,
 * and a missing function throws inside the midi workflow and aborts the cast.
 * They do nothing except ask for a re-import, once per document per session,
 * and return nothing so midi reads no halt or template result from them.
 */

const warned = new Set<string>();

function warnLegacy(functionName: string, { item, macroItem, scope, args }: IMidiMacroFunctionContext) {
  const doc = scope?.macroActivity?.item ?? macroItem ?? item;
  const key = doc?.uuid ?? doc?.name ?? functionName;
  if (warned.has(key)) return;
  warned.add(key);

  const name = doc?.name ?? functionName;
  logger.warn(`AuraAutomations.${functionName} is no longer supported, re-import ${name} to use region automation`, { doc, args });
  ui.notifications.warn(game.i18n.format("ddb-importer.behaviors.macro.legacyAura", { name }));
}

export function DamageOnEntry(context: IMidiMacroFunctionContext = {}) {
  warnLegacy("DamageOnEntry", context);
}

export function ConditionOnEntry(context: IMidiMacroFunctionContext = {}) {
  warnLegacy("ConditionOnEntry", context);
}

export function AuraOnly(context: IMidiMacroFunctionContext = {}) {
  warnLegacy("AuraOnly", context);
}
