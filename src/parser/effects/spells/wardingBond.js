import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function wardingBondEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    { key: "data.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+1", priority: "20" },
    { key: "data.traits.dr.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "0", priority: "0" },
    { key: "data.bonuses.abilities.save", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "1", priority: "20" }
  );
  const itemMacroText = `
//DAE Macro Execute, Effect Value = "Macro Name" @target @item
const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);
const target = canvas.tokens.get(lastArg.tokenId)

const DAEItem = lastArg.efData.flags.dae.itemData

let caster = canvas.tokens.placeables.find(token => token?.actor?.items.get(DAEItem._id) != null)

if (args[0] === "on") {
    await DAE.setFlag(tactor, "WardingBondIds", {
        tokenID: tactor.id,
        casterID: caster.actor.id
    })
    SetWardingBondHook(target)

}

async function SetWardingBondHook(target) {
    const hookId = Hooks.on("preUpdateActor", async (actor, update) => {
        let flag = await DAE.getFlag(tactor, "WardingBondIds")
        if (flag.tokenID !== actor.id) return
        if (!"actorData.data.attributes.hp" in update) return;
        let oldHP = actor.data.data.attributes.hp.value;
        let newHP = getProperty(update, "data.attributes.hp.value");
        let hpChange = oldHP - newHP
        if (hpChange > 0 && typeof hpChange === "number") {
            let caster = game.actors.get(flag.casterID).getActiveTokens()[0]
            caster.actor.applyDamage(hpChange)
        }
    })
    DAE.setFlag(tactor, "WardingBondHook", hookId)
    
}

async function RemoveHook() {
    let flag = await DAE.getFlag(tactor, 'WardingBondHook');
    Hooks.off("preUpdateActor", flag);
    await DAE.unsetFlag(tactor, "WardingBondHook");
}

if (args[0] === "off") {
    RemoveHook()
    await DAE.unsetFlag(tactor, "WardingBondIds");
    console.log("Death Ward removed");
}

if (args[0] === "each") {
    await RemoveHook()
    await SetWardingBondHook()
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
