import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function blindnessDeafnessEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: "label=Blindness/Deafness,turn=end,saveDC=@attributes.spelldc,saveAbility=con,savingThrow=true,saveMagic=true",
    priority: "20",
  });
  // MACRO START
  const itemMacroText = `
if(!game.modules.get("advanced-macros")?.active) {ui.notifications.error("Please enable the Advanced Macros module") ;return;}
if(!game.modules.get("dfreds-convenient-effects")?.active) {ui.notifications.error("Please enable the CE module"); return;}

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

function effectAppliedAndActive(conditionName) {
  return targetActor.data.effects.some(
    (activeEffect) =>
      activeEffect?.data?.flags?.isConvenient &&
      activeEffect?.data?.label == conditionName &&
      !activeEffect?.data?.disabled
  );
}

if (args[0] === "on") {
    new Dialog({
        title: "Choose an Effect",
        buttons: {
            one: {
                label: "Blindness",
                callback: () => {
                    DAE.setFlag(targetActor, "DAEBlind", "blind")
                    game.dfreds.effectInterface.addEffect("Blinded", targetActor.uuid)
                }
            },
            two: {
                label: "Deafness",
                callback: () => {
                    DAE.setFlag(targetActor, "DAEBlind", "deaf")
                    game.dfreds.effectInterface.addEffect("Deafened", targetActor.uuid)
                }
            }
        },
    }).render(true);
}

if (args[0] === "off") {
    let flag = DAE.getFlag(targetActor, "DAEBlind")
    if (flag === "blind") {
        if (effectAppliedAndActive("Blinded", targetActor)) game.dfreds.effectInterface.removeEffect("Blinded", targetActor.uuid)
    } else if (flag === "deaf") {
        if (effectAppliedAndActive("Deafened", targetActor)) game.dfreds.effectInterface.removeEffect("Deafened", targetActor.uuid)
    }
    DAE.unsetFlag(targetActor, "DAEBlind")
}

`;
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
