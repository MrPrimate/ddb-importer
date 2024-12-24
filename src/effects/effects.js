import { AutoEffects, ChangeHelper, MidiEffects } from "../parser/enrichers/effects/_module.mjs";

// eslint-disable-next-line complexity
export function effectModules() {
  return AutoEffects.effectModules();
}

export function baseEffect(foundryItem, name,
  { transfer = true, disabled = false, description = null, durationSeconds = null,
    durationRounds = null, durationTurns = null } = {},
) {
  return AutoEffects.BaseEffect(foundryItem, name, {
    transfer, disabled, description, durationSeconds, durationRounds, durationTurns,
  });
}

export function baseItemEffect(foundryItem, name,
  { transfer = true, disabled = false, description = null, durationSeconds = null,
    durationRounds = null, durationTurns = null } = {},
) {
  return AutoEffects.BaseEffect(foundryItem, name, {
    transfer, disabled, description, durationSeconds, durationRounds, durationTurns,
  });
}

export function baseFeatEffect(document, label,
  { transfer = false, disabled = false, description = null, durationSeconds = null,
    durationRounds = null, durationTurns = null } = {},
) {
  return AutoEffects.BaseEffect(document, label, {
    transfer, disabled, description, durationSeconds, durationRounds, durationTurns,
  });
}

export function getMidiCEOnFlags(midiFlags = {}) {
  return MidiEffects.getMidiCEOnFlags(midiFlags);
}

export function applyDefaultMidiFlags(document) {
  return MidiEffects.applyDefaultMidiFlags(document);
}

export function forceItemEffect(document) {
  return AutoEffects.forceDocumentEffect(document);
}

// *
// CONST.ACTIVE_EFFECT_MODES.
// ADD: 2
// CUSTOM: 0
// DOWNGRADE: 3
// MULTIPLY: 1
// OVERRIDE: 5
// UPGRADE: 4
//


export function addStatusEffectChange({ effect, statusName, priority = 20, level = null } = {}) {
  return ChangeHelper.addStatusEffectChange({ effect, statusName, priority, level });
}

// Refactored functions

export function generateSignedAddChange(value, priority, key) {
  return ChangeHelper.signedAddChange(value, priority, key);
}

export function generateUnsignedAddChange(value, priority, key) {
  return ChangeHelper.unsignedAddChange(value, priority, key);
}

export function generateCustomChange(value, priority, key) {
  return ChangeHelper.customChange(value, priority, key);
}

export function generateCustomBonusChange(value, priority, key) {
  return ChangeHelper.customBonusChange(value, priority, key);
}

export function generateUpgradeChange(value, priority, key) {
  return ChangeHelper.upgradeChange(value, priority, key);
}

export function generateOverrideChange(value, priority, key) {
  return ChangeHelper.overrideChange(value, priority, key);
}

export function generateMultiplyChange(value, priority, key) {
  return ChangeHelper.multiplyChange(value, priority, key);
}

export function generateDowngradeChange(value, priority, key) {
  return ChangeHelper.downgradeChange(value, priority, key);
}

export function generateTokenMagicFXChange(macroValue, priority = 20) {
  return ChangeHelper.tokenMagicFXChange(macroValue, priority);
}

export function generateATLChange(atlKey, mode, value, priority = 20) {
  return ChangeHelper.atlChange(atlKey, mode, value, priority);
}
