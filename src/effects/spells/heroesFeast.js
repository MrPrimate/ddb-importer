import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function heroesFeastEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    { key: "data.traits.di.value", value: "poison", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20 },
    { key: "data.traits.ci.value", value: "frightened", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20 }
  );
  // MACRO START
  const itemMacroText = `
if (!game.modules.get("advanced-macros")?.active) {
  ui.notifications.error("Please enable the Advanced Macros module");
  return;
}
const lastArg = args[args.length - 1];
const castItemName = "Summoned Arcane Sword";
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const target = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const amount = args[1];

async function updateHP(max, current) {
  return target.update({ "data.attributes.hp.max": max, "data.attributes.hp.value": current });
}

// Update HP and Max HP to roll formula, save result as flag
if (args[0] === "on") {
  const hpMax = target.data.data.attributes.hp.max;
  const hp = target.data.data.attributes.hp.value;
  await updateHP(hpMax + amount,  hp + amount);
  ChatMessage.create({ content: \`\${target.name} gains \${amount} Max HP\` });
  await DAE.setFlag(target, "heroesFeastSpell", amount);
}

// Remove Max Hp and reduce HP to max if needed
if (args[0] === "off") {
  const amountOff = await DAE.getFlag(target, "heroesFeastSpell");
  const hpMax = target.data.data.attributes.hp.max;
  const newHpMax = hpMax - amountOff;
  const hp = target.data.data.attributes.hp.value > newHpMax ? newHpMax : target.data.data.attributes.hp.value;
  await updateHP(newHpMax,  hp);
  ChatMessage.create({ content: target.name + "'s Max HP returns to normal" });
  DAE.unsetFlag(target, "heroesFeastSpell");
}
`;
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange("@damage", 0));
  document.effects.push(effect);

  return document;
}
