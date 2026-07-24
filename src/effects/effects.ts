import { AutoEffects, ChangeHelper, MidiEffects } from "../parser/enrichers/effects/_module";

export function effectModules() {
  return AutoEffects.effectModules();
}

export function baseEffect(foundryItem: I5ePCConsumptionItems, name: string,
  { transfer = true, disabled = false, description, durationSeconds,
    durationRounds, durationTurns, showIcon }: IDDBEffectOptions = {},
): TInitializedEffect {
  return AutoEffects.BaseEffect(foundryItem, name, {
    transfer, disabled, description, durationSeconds, durationRounds, durationTurns, showIcon,
  }) as TInitializedEffect;
}

export function baseItemEffect(foundryItem: I5ePCConsumptionItems, name: string,
  { transfer = true, disabled = false, description, durationSeconds,
    durationRounds, durationTurns, showIcon }: IDDBEffectOptions = {},
): TInitializedEffect {
  return AutoEffects.BaseEffect(foundryItem, name, {
    transfer, disabled, description, durationSeconds, durationRounds, durationTurns, showIcon,
  }) as TInitializedEffect;
}

export function baseFeatEffect(document: I5ePCConsumptionItems, label: string,
  { transfer = false, disabled = false, description, durationSeconds,
    durationRounds, durationTurns, showIcon }: IDDBEffectOptions = {},
): TInitializedEffect {
  return AutoEffects.BaseEffect(document, label, {
    transfer, disabled, description, durationSeconds, durationRounds, durationTurns, showIcon,
  }) as TInitializedEffect;
}

export function getMidiCEOnFlags(midiFlags = {}) {
  return MidiEffects.getMidiCEOnFlags(midiFlags);
}

export function applyDefaultMidiFlags(document: I5ePCConsumptionItems) {
  return MidiEffects.applyDefaultMidiFlags(document);
}

export function forceItemEffect(document: I5ePCConsumptionItems) {
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


export function addStatusEffectChange({ effect, statusName, priority = 20, level = null }: {
  effect: I5eEffectData; statusName: string; priority?: number; level?: number | null;
}) {
  return ChangeHelper.addStatusEffectChange({ effect, statusName, priority, level });
}

// Refactored functions

export function generateSignedAddChange(value: string | number, priority: number, key: string) {
  return ChangeHelper.signedAddChange(value, priority, key);
}

export function generateUnsignedAddChange(value: string | number, priority: number, key: string) {
  return ChangeHelper.unsignedAddChange(value, priority, key);
}

export function generateCustomChange(value: string | number, priority: number, key: string) {
  return ChangeHelper.customChange(value, priority, key);
}

export function generateCustomBonusChange(value: string | number, priority: number, key: string) {
  return ChangeHelper.customBonusChange(value, priority, key);
}

export function generateUpgradeChange(value: string | number, priority: number, key: string) {
  return ChangeHelper.upgradeChange(value, priority, key);
}

export function generateOverrideChange(value: string | number, priority: number, key: string) {
  return ChangeHelper.overrideChange(value, priority, key);
}

export function generateMultiplyChange(value: string | number, priority: number, key: string) {
  return ChangeHelper.multiplyChange(value, priority, key);
}

export function generateDowngradeChange(value: string | number, priority: number, key: string) {
  return ChangeHelper.downgradeChange(value, priority, key);
}

export function generateTokenMagicFXChange(macroValue: string, priority = 20) {
  return ChangeHelper.tokenMagicFXChange(macroValue, priority);
}

export function generateATLChange(atlKey: string, mode: TActiveEffectChangeType, value: string | number, priority = 20) {
  return ChangeHelper.atlChange(atlKey, mode, value, priority);
}
