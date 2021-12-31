import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function moonbeamEffect(document) {
  let effectMoonbeamMoonbeamSummon = baseSpellEffect(document, document.name);
  const itemMacroText = `
//DAE Item Macro Execute, Effect Value = @attributes.spelldc
if (!game.modules.get("advanced-macros")?.active) ui.notifications.error("Please enable the Advanced Macros module")

const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);
const target = canvas.tokens.get(lastArg.tokenId)

const DAEItem = lastArg.efData.flags.dae.itemData
const saveData = DAEItem.data.save
const DC = args[1]
/**
 * Create Moonbeam item in inventory
 */
if (args[0] === "on") {
  let range = canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [{
    t: "circle",
    user: game.user._id,
    x: target.x + canvas.grid.size / 2,
    y: target.y + canvas.grid.size / 2,
    direction: 0,
    distance: 60,
    borderColor: "#517bc9",
    flags: {
      DAESRD: {
        MoonbeamRange: {
          ActorId: tactor.id
        }
      }
    }
    //fillColor: "#FF3366",
  }]);

  range.then(result => {
    let templateData = {
      t: "circle",
      user: game.user._id,
      distance: 5,
      direction: 0,
      x: 0,
      y: 0,
      flags: {
        DAESRD: {
          Moonbeam: {
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
      let removeTemplates = canvas.templates.placeables.filter(i => i.data.flags.DAESRD?.MoonbeamRange?.ActorId === tactor.id);
      await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [removeTemplates[0].id]);
    };

    let damage = DAEItem.data.level;
    tactor.createOwnedItem(
      {
        "name": "Moonbeam repeating",
        "type": "spell",
        "data": {
          "source": "Casting Moonbeam",
          "ability": "",
          "description": {
            "value": "half damage on save"
          },
          "actionType": "save",
          "attackBonus": 0,
          "damage": {
            "parts": [
              [
                \`\${damage}d10\`,
                "radiant"
              ]
            ],
          },
          "formula": "",
          "save": {
            "ability": "con",
            "dc": saveData.dc,
            "scaling": "spell"
          },
          "level": 0,
          "school": "abj",
          "preparation": {
            "mode": "prepared",
            "prepared": false
          },

        },
        "img": DAEItem.img,
        "effects": []
      }
    );
  });
}

// Delete Moonbeam
if (args[0] === "off") {
  let casterItem = tactor.data.items.find(i => i.name === "Moonbeam repeating" && i.type === "spell")
  tactor.deleteOwnedItem(casterItem._id)
  let template = canvas.templates.placeables.find(i => i.data.flags.DAESRD?.Moonbeam?.ActorId === tactor.id)
  canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [template.id])
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effectMoonbeamMoonbeamSummon.changes.push(generateMacroChange("@attributes.spelldc"));
  document.effects.push(effectMoonbeamMoonbeamSummon);

  return document;
}
