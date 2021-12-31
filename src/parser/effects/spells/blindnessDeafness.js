import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function blindnessDeafnessEffect(document) {
  let effectBlindnessDeafnessBlindnessDeafness = baseSpellEffect(document, document.name);
  effectBlindnessDeafnessBlindnessDeafness.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    value: "turn=end, saveDC = @attributes.spelldc, saveAbility=con, savingThrow=true",
    priority: "20",
  });
  const itemMacroText = `
if(!game.modules.get("advanced-macros")?.active) {ui.notifications.error("Please enable the Advanced Macros module") ;return;}
if(!game.modules.get("dfreds-convenient-effects")?.active) {ui.notifications.error("Please enable the CE module"); return;}

//DAE macro, call directly with no arguments
const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);

if (args[0] === "on") {
    new Dialog({
        title: "Choose an Effect",
        buttons: {
            one: {
                label: "Blindness",
                callback: () => {
                    DAE.setFlag(tactor, "DAEBlind", "blind")
                    game.dfreds.effectInterface.addEffect("Blinded", tactor.uuid)
                }
            },
            two: {
                label: "Deafness",
                callback: () => {
                    DAE.setFlag(tactor, "DAEBlind", "deaf")
                    game.dfreds.effectInterface.addEffect("Deafened", tactor.uuid)
                }
            }
        },
    }).render(true);
}
if (args[0] === "off") {
    let flag = DAE.getFlag(tactor, "DAEBlind")
    if (flag === "blind") {
        game.dfreds.effectInterface.removeEffect("Blinded", tactor.uuid)
    } else if (flag === "deaf") {
        game.dfreds.effectInterface.removeEffect("Deafened", tactor.uuid)
    }
    DAE.unsetFlag(tactor, "DAEBlind")
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effectBlindnessDeafnessBlindnessDeafness.changes.push(generateMacroChange(""));
  document.effects.push(effectBlindnessDeafnessBlindnessDeafness);

  return document;
}
