import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function enhanceAbilityEffect(document) {
  let effectEnhanceAbilityEnhanceAbility = baseSpellEffect(document, document.name);
  const itemMacroText = `
//DAE Item Macro, no arguments passed
// only works with midi qol and speed roll ability checks
if (!game.modules.get("advanced-macros")?.active) {ui.notifications.error("Please enable the Advanced Macros module") ;return;}
const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);


/**
 * For each target select the effect (GM selection)
 */
if (args[0] === "on") {
    new Dialog({
        title: "Choose enhance ability effect for " + tactor.name,
        buttons: {
            one: {
                label: "Bear's Endurance",
                callback: async () => {
                    let formula = \`2d6\`;
                    let amount = new Roll(formula).roll().total;
                    DAE.setFlag(tactor, 'enhanceAbility', {
                        name: "bear",
                    });
                    let effect = tactor.effects.find(i => i.data.label === "Enhance Ability");
                    let changes = effect.data.changes;
                    changes[1] = {
                        key: "flags.midi-qol.advantage.ability.save.con",
                        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                        priority: 20,
                        value: \`1\`,
                    }
                    await effect.update({ changes });
                    ChatMessage.create({ content: \`\${tactor.name} gains \${amount} temp Hp\` });
                    await tactor.update({ "data.attributes.hp.temp": amount });
                }
            },
            two: {
                label: "Bull's Strength",
                callback: async () => {
                    ChatMessage.create({ content: \`\${tactor.name}'s encumberance is doubled\` });
                    DAE.setFlag(tactor, 'enhanceAbility', {
                        name: "bull",
                    });
                    let effect = tactor.effects.find(i => i.data.label === "Enhance Ability");
                    let changes = effect.data.changes;
                    changes[1] = {
                        key: "flags.midi-qol.advantage.ability.check.str",
                        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                        priority: 20,
                        value: \`1\`,
                    }
                    await effect.update({ changes });
                    await tactor.setFlag('dnd5e', 'powerfulBuild', true);
                }
            },
            three: {
                label: "Cat's Grace",
                callback: async () => {
                    ChatMessage.create({ content: \`\${tactor.name} doesn't take damage from falling 20 feet or less if it isn't incapacitated.\` });
                    DAE.setFlag(tactor, 'enhanceAbility', {
                        name: "cat",
                    });
                    let effect = tactor.effects.find(i => i.data.label === "Enhance Ability");
                    let changes = effect.data.changes;
                    changes[1] = {
                        key: "flags.midi-qol.advantage.ability.check.dex",
                        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                        priority: 20,
                        value: \`1\`,
                    }
                    await effect.update({ changes });
                }
            },
            four: {
                label: "Eagle's Splendor",
                callback: async () => {
                    ChatMessage.create({ content: \`\${tactor.name} has advantage on Charisma checks\` });
                    DAE.setFlag(tactor, 'enhanceAbility', {
                        name: "eagle",
                    });
                    let effect = tactor.effects.find(i => i.data.label === "Enhance Ability");
                    let changes = effect.data.changes;
                    changes[1] = {
                        key: "flags.midi-qol.advantage.ability.check.cha",
                        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                        priority: 20,
                        value: \`1\`,
                    }
                    await effect.update({ changes });
                }
            },
            five: {
                label: "Fox's Cunning",
                callback: async () => {
                    ChatMessage.create({ content: \`\${tactor.name} has advantage on Intelligence checks\` });
                    DAE.setFlag(tactor, 'enhanceAbility', {
                        name: "fox",
                    });
                    let effect = tactor.effects.find(i => i.data.label === "Enhance Ability");
                    let changes = effect.data.changes;
                    changes[1] = {
                        key: "flags.midi-qol.advantage.ability.check.int",
                        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                        priority: 20,
                        value: \`1\`,
                    }
                    await effect.update({ changes });
                }
            },
            five: {
                label: "Owl's Wisdom",
                callback: async () => {
                    ChatMessage.create({ content: \`\${tactor.name} has advantage on Wisdom checks\` });
                    DAE.setFlag(tactor, 'enhanceAbility', {
                        name: "owl",
                    });
                    let effect = tactor.effects.find(i => i.data.label === "Enhance Ability");
                    let changes = effect.data.changes;
                    changes[1] = {
                        key: "flags.midi-qol.advantage.ability.check.wis",
                        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                        priority: 20,
                        value: \`1\`,
                    }
                    await effect.update({ changes });
                }
            }
        }
    }).render(true);
}

if (args[0] === "off") {
    let flag = DAE.getFlag(tactor, 'enhanceAbility');
    if (flag.name === "bull") tactor.unsetFlag('dnd5e', 'powerfulBuild', false);
    DAE.unsetFlag(tactor, 'enhanceAbility');
    ChatMessage.create({ content: "Enhance Ability has expired" });
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effectEnhanceAbilityEnhanceAbility.changes.push(generateMacroChange(""));
  document.effects.push(effectEnhanceAbilityEnhanceAbility);

  return document;
}
