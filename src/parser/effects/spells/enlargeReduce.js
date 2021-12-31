import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function enlargeReduceEffect(document) {
  let effectEnlargeReduceEnlargeReduce = baseSpellEffect(document, document.name);
  const itemMacroText = `
//DAE Macro Execute, Effect Value = "Macro Name" @target 

/**
 * For each target, the GM will have to choose 
 */

const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);

let target = canvas.tokens.get(lastArg.tokenId);
let originalSize = target.data.width;
let mwak = target.actor.data.data.bonuses.mwak.damage;

if (args[0] === "on") {
    new Dialog({
        title: "Enlarge or Reduce",
        buttons: {
            one: {
                label: "Enlarge",
                callback: () => {
                    let bonus = mwak + "+ 1d4";
                    let enlarge = (originalSize + 1);
                    tactor.update({ "data.bonuses.mwak.damage": bonus });
                    target.update({ "width": enlarge, "height": enlarge });
                    DAE.setFlag(tactor, 'enlageReduceSpell', {
                        size: originalSize,
                        ogMwak: mwak,
                    });
                    ChatMessage.create({ content: \`\${target.name} is enlarged\` });
                }
            },
            two: {
                label: "Reduce",
                callback: () => {
                    let bonus = mwak + " -1d4";
                    let size = originalSize;
                    let newSize = (size > 1) ? (size - 1) : (size - 0.3);
                    tactor.update({ "data.bonuses.mwak.damage": bonus });
                    target.update({ "width": newSize, "height": newSize });
                    DAE.setFlag(tactor, 'enlageReduceSpell', {
                        size: originalSize,
                        ogMwak: mwak,
                    });
                    ChatMessage.create({ content: \`\${target.name} is reduced\` });
                }
            },
        }
    }).render(true);
}
if (args[0] === "off") {
    let flag = DAE.getFlag(tactor, 'enlageReduceSpell');
    tactor.update({ "data.bonuses.mwak.damage": flag.ogMwak });
    target.update({ "width": flag.size, "height": flag.size });
    DAE.unsetFlag(tactor, 'enlageReduceSpell');
    ChatMessage.create({ content: \`\${target.name} is returned to normal size\` });
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effectEnlargeReduceEnlargeReduce.changes.push(generateMacroChange("", 0));
  document.effects.push(effectEnlargeReduceEnlargeReduce);

  return document;
}
