import { utils } from "../lib/_module.mjs";
import { DICTIONARY } from "../config/_module.mjs";
import { AutoEffects, ChangeHelper, EffectGenerator, MidiEffects } from "../parser/enrichers/effects/_module.mjs";


/**
 * Add supported effects here to exclude them from calculations.
 */
const EXCLUDED = DICTIONARY.effects.excludedModifiers;

export function getEffectExcludedModifiers(type, features, ac) {
  let modifiers = [];

  if (type !== "item") {
    // features represent core non ac features
    if (features) {
      modifiers = modifiers.concat(EXCLUDED.common, EXCLUDED.speedMonk);
      if (!["race"].includes(type)) {
        modifiers = modifiers.concat(EXCLUDED.senses, EXCLUDED.speedSet, EXCLUDED.speedBonus);
      }
    }
    // here ac represents the more exotic ac effects that set limits and change base
    modifiers = modifiers.concat(EXCLUDED.acBonus);
    if (ac) {
      modifiers = modifiers.concat(EXCLUDED.ac);
    }
  }

  // items are basically their own thing, all or nuffin
  if (type === "item") {
    modifiers = modifiers.concat(
      EXCLUDED.senses,
      EXCLUDED.common,
      EXCLUDED.abilityBonus,
      EXCLUDED.languages,
      EXCLUDED.proficiencyBonus,
      EXCLUDED.speedSet,
      EXCLUDED.speedBonus,
      EXCLUDED.speedMonk,
      EXCLUDED.ac,
      EXCLUDED.acBonus,
    );
  }
  return modifiers;
}

// eslint-disable-next-line complexity
export function effectModules() {
  if (CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules) {
    return CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules;
  }
  const midiQolInstalled = game.modules.get("midi-qol")?.active ?? false;
  const timesUp = game.modules.get("times-up")?.active ?? false;
  const daeInstalled = game.modules.get("dae")?.active ?? false;

  const activeAurasInstalled = game.modules.get("ActiveAuras")?.active ?? false;
  const atlInstalled = game.modules.get("ATL")?.active ?? false;
  const tokenMagicInstalled = game.modules.get("tokenmagic")?.active ?? false;
  const autoAnimationsInstalled = game.modules.get("autoanimations")?.active ?? false;
  const chrisInstalled = game.modules.get("chris-premades")?.active ?? false;
  const vision5eInstalled = game.modules.get("vision-5e")?.active ?? false;

  CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules = {
    hasCore: midiQolInstalled && timesUp && daeInstalled,
    hasMonster: midiQolInstalled && timesUp && daeInstalled,
    midiQolInstalled,
    timesUp,
    daeInstalled,
    atlInstalled,
    tokenMagicInstalled,
    activeAurasInstalled,
    autoAnimationsInstalled,
    chrisInstalled,
    vision5eInstalled,
  };
  return CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules;
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

export function getMidiCEOnFlags(midiFlags = {}) {
  foundry.utils.setProperty(midiFlags, "forceCEOff", false);
  foundry.utils.setProperty(midiFlags, "forceCEOn", true);
  return midiFlags;
}

export function applyDefaultMidiFlags(document) {
  return MidiEffects.applyDefaultMidiFlags(document);
}

export function forceItemEffect(document) {
  return AutoEffects.forceDocumentEffect(document);
}

export function forceManualReaction(document) {
  foundry.utils.setProperty(document, "flags.midi-qol.reactionCondition", "false");
  return document;
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

export function generateBaseSkillEffect(id, label) {
  const mockItem = {
    img: "icons/svg/up.svg",
  };
  let skillEffect = baseItemEffect(mockItem, label);
  skillEffect.flags.dae = {};
  skillEffect.flags.ddbimporter.characterEffect = true;
  skillEffect.origin = `Actor.${id}`;
  delete skillEffect.transfer;
  return skillEffect;
}

export function addStatusEffectChange({ effect, statusName, priority = 20, level = null } = {}) {
  return ChangeHelper.addStatusEffectChange({ effect, statusName, priority, level });
}

export function addSimpleConditionEffect(document, condition, { disabled, transfer } = {}) {
  document.effects = [];
  const effect = baseItemEffect(document, `${document.name} - ${utils.capitalize(condition)}`, { disabled, transfer });
  addStatusEffectChange({ effect, statusName: condition });
  document.effects.push(effect);
  return document;
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

export function generateEffects({ ddb, character, ddbItem, foundryItem, isCompendiumItem, type, description = "" } = {}) {

  const generator = new EffectGenerator({
    ddb,
    character,
    ddbItem,
    foundryItem,
    isCompendiumItem,
    type,
    description,
  });

  generator.generate();
  return generator.document;

}
