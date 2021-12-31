import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function divineWordEffect(document) {
  let effectDivineWordDivineWord = baseSpellEffect(document, document.name);
  const itemMacroText = `
////DAE Item Macro 
//// Requires Convenient Effects and About Time

/**
 * Apply Divine Word to targeted tokens
 * @param {Number} targetHp 
 * @param {Boolean} linked 
 */

const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);
const target = canvas.tokens.get(lastArg.tokenId)

function effectAppliedAndActive(conditionName, tactor) {
  return target.data.effects.some(
    (activeEffect) =>
      activeEffect?.data?.flags?.isConvenient &&
      activeEffect?.data?.label == conditionName &&
      !activeEffect?.data?.disabled
  );
}
 
async function DivineWordApply(target, targetHp) {
  if (targetHp <= 20) {
      await target.actor.update({ "data.attributes.hp.value": 0 });
  } else {
    if (targetHp <= 30) {
        const hasStunned = effectAppliedAndActive("Stunned", tactor);
        if (!hasStunned) await game.dfreds.effectInterface.toggleEffect("Stunned", tactor.uuid);
        game.Gametime.doIn({ hours: 1 }, async () => {
            await game.dfreds.effectInterface.removeEffect("Stunned", tactor.uuid);
        });
    }
    if (targetHp <= 40) {
        const hasBlinded = effectAppliedAndActive("Blinded", tactor);
        if (!hasBlinded)  await game.dfreds.effectInterface.toggleEffect("Blinded", tactor.uuid);
        game.Gametime.doIn({ hours: 1 }, async () => {
            await game.dfreds.effectInterface.removeEffect("Blinded", tactor.uuid);
        });
    }
    if (targetHp <= 50) {
        const hasDeafened = effectAppliedAndActive("Deafened", tactor);
        if (!hasDeafened)  await game.dfreds.effectInterface.toggleEffect("Deafened", tactor.uuid);
        game.Gametime.doIn({ hours: 1 }, async () => {
            await game.dfreds.effectInterface.removeEffect("Deafened", tactor.uuid);
        });
    }
  }
}
if (args[0] === "on") {
    DivineWordApply(target, target.actor.data.data.attributes.hp.value)
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effectDivineWordDivineWord.changes.push(generateMacroChange(""));
  document.effects.push(effectDivineWordDivineWord);

  return document;
}
