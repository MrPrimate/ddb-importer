import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function irresistibleDanceEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  effect.changes.push({
    key: "flags.midi-qol.disadvantage.ability.save.str",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: "1",
    priority: "20",
  });
  effect.changes.push({
    key: "flags.midi-qol.disadvantage.attack.all",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: "1",
    priority: "20",
  });
  effect.changes.push({
    key: "flags.midi-qol.grants.advantage.attack.all ",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: "1",
    priority: "20",
  });

  effect.flags.dae.macroRepeat = "startEveryTurn";
  const itemMacroText = `
if (!game.modules.get("advanced-macros")?.active) {
  ui.notifications.error("Please enable the Advanced Macros module");
  return;
}
const lastArg = args[args.length - 1];

//DAE Macro Execute, Effect Value = "Macro Name"
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const DAEItem = lastArg.efData.flags.dae.itemData;
const saveData = DAEItem.data.save;

if (args[0] === "each") {
  new Dialog({
    title: "Use action to make a wisdom save to end Irresistible Dance?",
    buttons: {
      one: {
        label: "Yes",
        callback: async () => {
          const flavor = \`\${CONFIG.DND5E.abilities[saveData.ability]} DC\${saveData.dc} \${DAEItem?.name || ""}\`;
          const saveRoll = (await targetActor.rollAbilitySave(saveData.ability, { flavor })).total;

          if (saveRoll >= saveData.dc) {
            targetActor.deleteEmbeddedDocuments("ActiveEffect", [lastArg.effectId]);
          } else {
            if (saveRoll < saveData.dc) ChatMessage.create({ content: \`\${targetActor.name} fails the save\` });
          }
        },
      },
      two: {
        label: "No",
        callback: () => {},
      },
    },
  }).render(true);
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
