import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function rayofEnfeeblementEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  // MACRO START
  const itemMacroText = `
//DAE Item Macro Execute, no arguments
if (!game.modules.get("advanced-macros")?.active) ui.notifications.error("Please enable the Advanced Macros module")

const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);
let weapons = tactor.items.filter(i => i.data.type === \`weapon\`);

/**
 * For every str weapon, update the damage formulas to half the damage, set flag of original
 */
if (args[0] === "on") {
    for (let weapon of weapons) {
        if (weapon.abilityMod === "str") {
            let newWeaponParts = duplicate(weapon.data.data.damage.parts);
            weapon.setFlag('world', 'RayOfEnfeeblement', newWeaponParts);
            for (let part of weapon.data.data.damage.parts) {
                part[0] = \`floor((\${part[0]})/2)\`;
            }
            weapon.update({ "data.damage.parts": weapon.data.data.damage.parts });
        }
    }
}

// Update weapons to old value
if (args[0] === "off") {
    for (let weapon of weapons) {
        let parts = weapon.getFlag('world', 'RayOfEnfeeblement');
        weapon.update({ "data.damage.parts": parts });
    }
}
`;
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
