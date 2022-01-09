import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function heroismEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "data.traits.ci.value",
    value: "frightened",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: 20,
  });
  effect.flags.dae.macroRepeat = "startEveryTurn";
  // MACRO START
  const itemMacroText = `
if (!game.modules.get("advanced-macros")?.active) {
  ui.notifications.error("Please enable the Advanced Macros module");
  return;
}
const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const amount = args[1];
const currentTemp = Number.isInteger(targetActor.data.data.attributes.hp.temp)
  ? targetActor.data.data.attributes.hp.temp
  : 0;

async function rejuvenateTempHP(tempHP) {
  if (tempHP > currentTemp) {
    const flag = await DAE.setFlag(targetActor, "heroismSpell", tempHP);
    await targetActor.update({ "data.attributes.hp.temp": tempHP });
    ChatMessage.create({ content: \`Heroism applies \${tempHP} temporary HP to \${targetActor.name}\` });
  }
}

if (args[0] === "on") {
  await rejuvenateTempHP(amount);
}
if (args[0] === "off") {
  const flag = await DAE.getFlag(targetActor, "heroismSpell");
  if (flag) {
    const endTempHP = currentTemp > flag ? currentTemp - flag : null;
    await targetActor.update({ "data.attributes.hp.temp": endTempHP });
    await DAE.unsetFlag(targetActor, "heroismSpell");
  }
  ChatMessage.create({ content: \`Heroism ends on \${targetActor.name}\` });
}
if (args[0] === "each") {
  await rejuvenateTempHP(amount);
}
`;
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange("@damage", 0));
  document.effects.push(effect);

  return document;
}
