import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function enhanceAbilityEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  // MACRO START
  const itemMacroText = `
if (!game.modules.get("advanced-macros")?.active) {
  ui.notifications.error("Please enable the Advanced Macros module");
  return;
}
const lastArg = args[args.length - 1];

//DAE Macro Execute, Effect Value = "Macro Name"
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

// only works with midi qol and speed roll ability checks

/**
 * For each target select the effect (GM selection)
 */
if (args[0] === "on") {
    new Dialog({
        title: "Choose enhance ability effect for " + targetActor.name,
        buttons: {
            one: {
                label: "Bear's Endurance",
                callback: async () => {
                    const amount = await new Roll("2d6").evaluate({async:true});
                    DAE.setFlag(targetActor, 'enhanceAbility', { name: "bear" });
                    const effect = targetActor.effects.find(i => i.data.label === "Enhance Ability");
                    let changes = effect.data.changes;
                    changes.push({
                        key: "flags.midi-qol.advantage.ability.save.con",
                        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                        priority: 20,
                        value: "1",
                    });
                    await effect.update({ changes });
                    if (Number.isInteger(targetActor.data.data.attributes.hp.temp) &&
                      targetActor.data.data.attributes.hp.temp > amount.total
                    ) {
                      ChatMessage.create({ content: \`\${targetActor.name} gains ${amount.total} temp Hp\` });
                      await targetActor.update({ "data.attributes.hp.temp": amount.total });
                    }
                }
            },
            two: {
                label: "Bull's Strength",
                callback: async () => {
                    ChatMessage.create({ content: \`\${targetActor.name}'s encumbrance is doubled\` });
                    DAE.setFlag(targetActor, 'enhanceAbility', { name: "bull" });
                    const effect = targetActor.effects.find(i => i.data.label === "Enhance Ability");
                    let changes = effect.data.changes;
                    changes.push({
                        key: "flags.midi-qol.advantage.ability.check.str",
                        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                        priority: 20,
                        value: "1",
                    });
                    await effect.update({ changes });
                    await targetActor.setFlag('dnd5e', 'powerfulBuild', true);
                }
            },
            three: {
                label: "Cat's Grace",
                callback: async () => {
                    ChatMessage.create({ content: \`\${targetActor.name} doesn't take damage from falling 20 feet or less if it isn't incapacitated.\` });
                    DAE.setFlag(targetActor, 'enhanceAbility', { name: "cat" });
                    const effect = targetActor.effects.find(i => i.data.label === "Enhance Ability");
                    let changes = effect.data.changes;
                    changes.push({
                        key: "flags.midi-qol.advantage.ability.check.dex",
                        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                        priority: 20,
                        value: "1",
                    });
                    await effect.update({ changes });
                }
            },
            four: {
                label: "Eagle's Splendor",
                callback: async () => {
                    ChatMessage.create({ content: \`\${targetActor.name} has advantage on Charisma checks\` });
                    DAE.setFlag(targetActor, 'enhanceAbility', { name: "eagle" });
                    const effect = targetActor.effects.find(i => i.data.label === "Enhance Ability");
                    let changes = effect.data.changes;
                    changes.push({
                        key: "flags.midi-qol.advantage.ability.check.cha",
                        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                        priority: 20,
                        value: "1",
                    });
                    await effect.update({ changes });
                }
            },
            five: {
                label: "Owl's Wisdom",
                callback: async () => {
                    ChatMessage.create({ content: \`\${targetActor.name} has advantage on Wisdom checks\` });
                    DAE.setFlag(targetActor, 'enhanceAbility', { name: "owl" });
                    const effect = targetActor.effects.find(i => i.data.label === "Enhance Ability");
                    let changes = effect.data.changes;
                    changes.push({
                        key: "flags.midi-qol.advantage.ability.check.wis",
                        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                        priority: 20,
                        value: "1",
                    });
                    await effect.update({ changes });
                }
            },
            six: {
              label: "Fox's Cunning",
              callback: async () => {
                  ChatMessage.create({ content: \`\${targetActor.name} has advantage on Intelligence checks\` });
                  DAE.setFlag(targetActor, 'enhanceAbility', { name: "fox" });
                  const effect = targetActor.effects.find(i => i.data.label === "Enhance Ability");
                  let changes = effect.data.changes;
                  changes.push({
                      key: "flags.midi-qol.advantage.ability.check.int",
                      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                      priority: 20,
                      value: "1",
                  });
                  await effect.update({ changes });
              }
          },
        }
    }).render(true);
}

if (args[0] === "off") {
    const flag = await DAE.getFlag(targetActor, 'enhanceAbility');
    if (flag.name === "bull") targetActor.unsetFlag('dnd5e', 'powerfulBuild', false);
    DAE.unsetFlag(targetActor, 'enhanceAbility');
    ChatMessage.create({ content: "Enhance Ability has expired" });
}

`;
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
