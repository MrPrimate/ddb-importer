import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function spiritualWeaponEffect(document) {
  let effectSpiritualWeaponSpiritualWeapon = baseSpellEffect(document, document.name);
  const itemMacroText = `
//DAE Item Macro Execute, value = @item.level
// Set spell to self cast, no damage/attack roll
const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);
const target = canvas.tokens.get(lastArg.tokenId) || token;

const castingItem = lastArg.efData.flags.dae.itemData
let data = {}

/**
 * Create Spiritual Weapon item in inventory
 */
if (args[0] === "on") {
  let damage = Math.floor(Math.floor(args[1] / 2));
  let image = castingItem.img;

  let range = canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [{
    t: "circle",
    user: game.user._id,
    x: target.x + canvas.grid.size / 2,
    y: target.y + canvas.grid.size / 2,
    direction: 0,
    distance: 60,
    borderColor: "#FF0000",
    flags: {
      DAESRD: {
        SpiritualWeaponRange: {
          ActorId: tactor.id
        }
      }
    }
    //fillColor: "#FF3366",
  }]);
  range.then(result => {
    let templateData = {
      t: "rect",
      user: game.user._id,
      distance: 7,
      direction: 45,
      x: 0,
      y: 0,
      flags: {
        DAESRD: {
          SpiritualWeapon: {
            ActorId: tactor.id
          }
        }
      },
      fillColor: game.user.color
    }
    Hooks.once("createMeasuredTemplate", deleteTemplates);

    let doc = new CONFIG.MeasuredTemplate.documentClass(templateData, { parent: canvas.scene })
    let template = new game.dnd5e.canvas.AbilityTemplate(doc)
    template.actorSheet = tactor.sheet;
    template.drawPreview()

    async function deleteTemplates() {
      let removeTemplates = canvas.templates.placeables.filter(i => i.data.flags.DAESRD?.SpiritualWeaponRange?.ActorId === tactor.id);
      await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [removeTemplates[0].id]);
    };
  })
  await tactor.createOwnedItem(
    {
      "name": "Summoned Spiritual Weapon",
      "type": "weapon",
      "data": {
        "equipped": true,
        "identified": true,
        "activation": {
          "type": "bonus",
        },
        "target": {
          "value": 1,
          "width": null,
          "type": "creature"
        },
        "range": {
          "value": 5,
          "units": "ft"
        },
        "ability": args[2],
        "actionType": "msak",
        "attackBonus": "0",
        "chatFlavor": "",
        "critical": null,
        "damage": {
          "parts": [
            [
              \`\${damage}d8+@mod\`,
              "force"
            ]
          ],
        },
        "weaponType": "simpleM",
        "proficient": true
      },
      "flags": {
        "DAESRD": {
          "SpiritualWeapon":
            target.actor.id
        }
      },
      "img": \`\${image}\`,
      "effects" : []
    },
  );
  ui.notifications.notify("Weapon created in your inventory")

}

// Delete Spitirual Weapon and template
if (args[0] === "off") {
  let removeItem = tactor.items.find(i => i.data.flags?.DAESRD?.SpiritualWeapon === tactor.id)
  let template = canvas.templates.placeables.find(i => i.data.flags.DAESRD.SpiritualWeapon?.ActorId === tactor.id)
  if(removeItem) await tactor.deleteOwnedItem(removeItem.id);
  if(template) await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [template.id])
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effectSpiritualWeaponSpiritualWeapon.changes.push(generateMacroChange("@item.level @attributes.spellcasting"));
  document.effects.push(effectSpiritualWeaponSpiritualWeapon);

  return document;
}
