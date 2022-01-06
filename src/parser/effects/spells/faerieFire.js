import { baseSpellEffect, generateMacroChange, generateMacroFlags, generateTokenMagicFXChange, spellEffectModules } from "../specialSpells.js";

export function faerieFireEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.grants.advantage.attack.all",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: "1",
    priority: "20",
  });
  // MACRO START
  const itemMacroText = `
if (!game.modules.get("advanced-macros")?.active) {ui.notifications.error("Please enable the Advanced Macros module") ;return;}

const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);
let target = canvas.tokens.get(lastArg.tokenId)

const DAEItem = lastArg.efData.flags.dae.itemData
const saveData = DAEItem.data.save

if (args[0] === "on") {

    new Dialog({
        title: \`Choose the colour for Faerie Fire on \${target.name}\`,
        buttons: {
            one: {
                label: "Blue",
                callback: async () => {
                    let color = target.data.lightColor ? target.data.lightColor : "";
                    let dimLight = target.data.dimLight ? target.data.dimLight : "0"
                    await DAE.setFlag(target, 'FaerieFire', {
                        color: color,
                        alpha: target.data.lightAlpha,
                        dimLight: dimLight
                    });
                    target.update({ "lightColor": "#5ab9e2", "lightAlpha": 0.64, "dimLight": "10", "lightAnimation.intensity" : 3 })
                }
            },
            two: {
                label: "Green",
                callback: async () => {
                    let color = target.data.lightColor ? target.data.lightColor : "";
                    let dimLight = target.data.dimLight ? target.data.dimLight : "0"
                    await DAE.setFlag(target, 'FaerieFire', {
                        color: color,
                        alpha: target.data.lightAlpha,
                        dimLight: dimLight
                    });
                    target.update({ "lightColor": "#55d553", "lightAlpha": 0.64, "dimLight": "10","lightAnimation.intensity" : 3  })
                }
            },
            three: {
                label: "Purple",
                callback: async () => {
                    let color = target.data.lightColor ? target.data.lightColor : "";
                    let dimLight = target.data.dimLight ? target.data.dimLight : "0"
                    await DAE.setFlag(target, 'FaerieFire', {
                        color: color,
                        alpha: target.data.lightAlpha,
                        dimLight: dimLight
                    });
                    target.update({ "lightColor": "#844ec6", "lightAlpha": 0.64, "dimLight": "10","lightAnimation.intensity" : 3  })
                }
            }
        }
    }).render(true);
}

if (args[0] === "off") {
    let { color, alpha, dimLight } = await DAE.getFlag(target, "FaerieFire")
    target.update({ "lightColor": color, "lightAlpha": alpha, "dimLight": dimLight })
    DAE.unsetFlag(tactor, "FaerieFire")
}
`;
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));

  if (spellEffectModules().tokenMagicInstalled) {
    effect.changes.push(generateTokenMagicFXChange("glow"));
  }

  document.effects.push(effect);

  return document;
}
