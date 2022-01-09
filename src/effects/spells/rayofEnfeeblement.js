import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function rayofEnfeeblementEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: `label=${document.name},turn=end,saveDC=@attributes.spelldc,saveAbility=con,savingThrow=true,saveMagic=true`,
    priority: "20",
  });
  // MACRO START
  const itemMacroText = `
if (!game.modules.get("advanced-macros")?.active) {
  ui.notifications.error("Please enable the Advanced Macros module");
  return;
}
const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const weapons = targetActor.data.items.filter((i) => i.data.type === "weapon");

/**
 * For every str weapon, update the damage formulas to half the damage, set flag of original
 */
if (args[0] === "on") {
  weapons.forEach((weapon) => {
    if (weapon.abilityMod === "str") {
      const originalParts = duplicate(weapon.data.data.damage.parts);
      weapon.setFlag("world", "RayOfEnfeeblementSpell", originalParts);
      weapon.data.data.damage.parts.forEach((part) => {
        part[0] = \`floor((\${part[0]})/2)\`;
      });
      weapon.update({ "data.damage.parts": weapon.data.data.damage.parts });
    }
  });
}

// Update weapons to old value
if (args[0] === "off") {
  weapons.forEach((weapon) => {
    const parts = weapon.getFlag("world", "RayOfEnfeeblementSpell");
    weapon.update({ "data.damage.parts": parts });
  });
}
`;
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
