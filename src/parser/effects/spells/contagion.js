import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function contagionEffect(document) {
  let effectContagionContagion = baseSpellEffect(document, document.name);
  effectContagionContagion.flags.dae.macroRepeat = "endEveryTurn";
  document.flags["midi-qol"] = { criticalThreshold: "20" };
  const itemMacroText = `
//DAE Item Macro  @attributes.spell.dc
const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);

const DAEItem = lastArg.efData.flags.dae.itemData
const dc = args[1]


if (args[0] === "on") {

    // Save the hook data for later access.
    DAE.setFlag(tactor, "ContagionSpell",  {
        count: 0,
    });
}

if (args[0] === "off") {
    // When off, clean up hooks and flags.

    DAE.unsetFlag(tactor, "ContagionSpell", );
}

if (args[0] === "each") {
    let contagion = lastArg.efData;
    if (contagion.label === "Contagion")
        Contagion()
}

/** 
 * Execute contagion effects, update flag counts or remove effect
 * 
 * @param {Actor5e} combatant Current combatant to test against
 * @param {Number} save Target DC for save
 */
async function Contagion() {
    let flag = DAE.getFlag(tactor, "ContagionSpell", );

    const flavor = \`\${CONFIG.DND5E.abilities["con"]} DC\${dc} \${DAEItem?.name || ""}\`;
    let saveRoll = (await tactor.rollAbilitySave("con", { flavor })).total;

    if (saveRoll < dc) {
        if (flag.count === 2) {
            ChatMessage.create({ content: \`Contagion on \${tactor.name} is complete\` });
            ContagionMessage();
            return;
        }
        else {
            let contagionCount = (flag.count + 1);
            DAE.setFlag(tactor, "ContagionSpell", {
                count: contagionCount
            });
            console.log(\`Contagion increased to \${contagionCount}\`);
        }
    }
    else if (saveRoll >=dc) {
        tactor.deleteEmbeddedEntity("ActiveEffect", lastArg.effectId); 
    }
}

/**
 * Generates the GM client dialog for selecting final Effect, updates target effect with name, icon and new DAE effects.
 */
async function ContagionMessage() {
    new Dialog({
        title: "Contagion options",
        content: "<p>Select the effect</p>",
        buttons: {
            one: {
                label: "Blinding Sickness",
                callback: async () => {
                     let data = {
                        changes: [
                            {
                                key: "flags.midi-qol.disadvantage.ability.check.wis",
                                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                priority: 20,
                                value: "1",
                            },
                            {
                                key: "flags.midi-qol.disadvantage.ability.save.wis",
                                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                priority: 20,
                                value: "1",
                            },
                        ],
                        icon: "modules/dfreds-convenient-effects/images/blinded.svg",
                        label: "Blinding Sickness",
                        _id:  lastArg.effectId
                    }
                    tactor.updateEmbeddedDocuments("ActiveEffect", [data]);
                },
            },
            two: {
                label: "Filth Fever",
                callback: async () => {
                    let data = {
                        changes: [
                            {
                                key: "flags.midi-qol.disadvantage.attack.mwak",
                                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                priority: 20,
                                value: "1",
                            },
                            {
                                key: "flags.midi-qol.disadvantage.attack.rwak",
                                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                priority: 20,
                                value: "1",
                            },
                            {
                                key: "flags.midi-qol.disadvantage.ability.check.str",
                                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                priority: 20,
                                value: "1",
                            },
                            {
                                key: "flags.midi-qol.disadvantage.ability.save.str",
                                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                priority: 20,
                                value: "1",
                            },
                        ],
                        label: "Filth Fever",
                        _id: lastArg.effectId,
                    }
                    tactor.updateEmbeddedDocuments("ActiveEffect", [data]);
                }
            },
            three: {
                label: "Flesh Rot",
                callback: async () => {
                    let data = {
                        changes: [
                            {
                                key: "flags.midi-qol.disadvantage.ability.check.cha",
                                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                priority: 20,
                                value: "1",
                            },
                            {
                                key: "data.traits.dv.all",
                                mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                                priority: 20,
                                value: "1",
                            },
                        ],
                        icon : "systems/dnd5e/icons/skills/blood_09.jpg",
                        label : "Flesh Rot",
                        _id: lastArg.effectId,
                    }
                    tactor.updateEmbeddedDocuments("ActiveEffect", [data]);
                },
            },
            four: {
                label: "Mindfire",
                callback: async () => {
                    let data = {
                        changes: [
                            {
                                key: "flags.midi-qol.disadvantage.ability.check.int",
                                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                priority: 20,
                                value: "1",
                            },
                            {
                                key: "flags.midi-qol.disadvantage.ability.save.int",
                                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                priority: 20,
                                value: "1",
                            },
                        ],
                        icon : "icons/svg/daze.svg",
                        label : "Mindfire",
                        _id: lastArg.effectId,
                    }
                    tactor.updateEmbeddedDocuments("ActiveEffect", [data]);
                }
            },
            five: {
                label: "Seizure",
                callback: async () => {
                    let data = {
                        changes: [
                            {
                                key: "flags.midi-qol.disadvantage.attack.mwak",
                                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                priority: 20,
                                value: "1",
                            },
                            {
                                key: "flags.midi-qol.disadvantage.attack.rwak",
                                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                priority: 20,
                                value: "1",
                            },
                            {
                                key: "flags.midi-qol.disadvantage.ability.check.dex",
                                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                priority: 20,
                                value: "1",
                            },
                            {
                                key: "flags.midi-qol.disadvantage.ability.save.dex",
                                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                priority: 20,
                                value: "1",
                            },
                        ],
                        icon : "icons/svg/paralysis.svg",
                        label : "Seizure",
                        _id: lastArg.effectId,
                    }
                    tactor.updateEmbeddedDocuments("ActiveEffect", [data]);
                }
            },
            six: {
                label: "Slimy Doom",
                callback: async () => {
                    let data = {
                        changes: [
                            {
                                key: "flags.midi-qol.disadvantage.ability.check.con",
                                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                priority: 20,
                                value: "1",
                            },
                            {
                                key: "flags.midi-qol.disadvantage.ability.save.con",
                                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                                priority: 20,
                                value: "1",
                            },
                        ],
                        icon : "systems/dnd5e/icons/skills/blood_05.jpg",
                        label : "Slimy Doom",
                        _id: lastArg.effecId,
                    }
                    tactor.updateEmbeddedDocuments("ActiveEffect", [data]);
                }
            },
        }
    }).render(true);
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effectContagionContagion.changes.push(generateMacroChange("@attributes.spelldc"));
  document.effects.push(effectContagionContagion);

  return document;
}
