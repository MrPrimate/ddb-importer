import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function heroesFeastEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    { key: "data.traits.di.value", value: "poison", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20 },
    { key: "data.traits.ci.value", value: "frightened", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20 }
  );
  const itemMacroText = `
//DAE Macro , Effect Value = @damage
if(!game.modules.get("advanced-macros")?.active) {ui.notifications.error("Please enable the Advanced Macros module") ;return;}


const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);
const target = canvas.tokens.get(lastArg.tokenId)


let amount = args[1]
/**
 * Update HP and Max HP to roll formula, save result as flag
 */
if (args[0] === "on") {
        let hpMax = tactor.data.data.attributes.hp.max;
        let hp = tactor.data.data.attributes.hp.value;
        await tactor.update({"data.attributes.hp.max": (hpMax + amount), "data.attributes.hp.value": (hp + amount) });
        ChatMessage.create({content: \`\${target.name} gains \${amount} Max HP\`});
        await DAE.setFlag(tactor, 'HeroesFeast', amount);
};

// Remove Max Hp and reduce HP to max if needed
if (args[0] === "off") {
        let amountOff = await DAE.getFlag(tactor, 'HeroesFeast');
        let hpMax = tactor.data.data.attributes.hp.max;
        let newHpMax = hpMax - amountOff;
        let hp = tactor.data.data.attributes.hp.value > newHpMax ? newHpMax : tactor.data.data.attributes.hp.value
        await tactor.update({"data.attributes.hp.max": newHpMax, "data.attributes.hp.value" : hp });
        ChatMessage.create({content: target.name + "'s Max HP returns to normal"});
        DAE.unsetFlag(tactor, 'HeroesFeast');
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange("@damage", 0));
  document.effects.push(effect);

  return document;
}
