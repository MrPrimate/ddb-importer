import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function flameBladeEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = `
//DAE Item Macro, no arguments passed
if (!game.modules.get("advanced-macros")?.active) ui.notifications.error("Please enable the Advanced Macros module")

const lastArg = args[args.length-1]
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);

const DAEItem = lastArg.efData.flags.dae.itemData
const saveData = DAEItem.data.save

/**
 * Create Flame Blade item in inventory
 */
if (args[0] === "on") {
  let weaponDamge = 2 + Math.floor(DAEItem.data.level / 2);
  await tactor.createOwnedItem(
    {
      "name": "Summoned Flame Blade",
      "type": "weapon",
      "data": {
        "quantity": 1,
        "activation": {
          "type": "action",
          "cost": 1,
          "condition": ""
        },
        "target": {
          "value": 1,
          "width": null,
          "units": "",
          "type": "creature"
        },
        "range": {
          "value": 5,
        },
        "ability": "",
        "actionType": "msak",
        "attackBonus": "0",
        "damage": {
          "parts": [
            [
              \`\${weaponDamge}d6\`,
              "fire"
            ]
          ],
        },
        "weaponType": "simpleM",
        "proficient": true,
      },
      "img": DAEItem.img,
      "effects" : []
    }
  );
  ui.notifications.notify("A Flame Blade appears in your inventory")
}

// Delete Flame Blade
if (args[0] === "off") {
  let castItem = tactor.data.items.find(i => i.name === "Summoned Flame Blade" && i.type === "weapon")
  if(castItem) await tactor.deleteOwnedItem(castItem._id)
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange("@item.level @attributes.spellcasting"));
  document.effects.push(effect);

  return document;
}
