import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function callLightningEffect(document) {
  let effectCallLightningCallLightningSummon = baseSpellEffect(document, document.name);
  const itemMacroText = `
//DAE Macro no arguments passed
if (!game.modules.get("advanced-macros")?.active) ui.notifications.error("Please enable the Advanced Macros module")

const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);

const DAEitem = lastArg.efData.flags.dae.itemData
const saveData = DAEitem.data.save
/**
 * Create Call Lightning Bolt item in inventory
 */
if (args[0] === "on") {
    let templateData = {
        t: "circle",
        user: game.user._id,
        distance: 60,
        direction: 0,
        x: 0,
        y: 0,
        flags: {
            DAESRD: {
                CallLighting: {
                    ActorId: tactor.id
                }
            }
        },
        fillColor: game.user.color
    }
    let doc = new CONFIG.MeasuredTemplate.documentClass(templateData, { parent: canvas.scene })
    let template = new game.dnd5e.canvas.AbilityTemplate(doc)
    template.actorSheet = tactor.sheet;
    template.drawPreview()

    await tactor.createOwnedItem(
        {
            "name": "Call Lightning - bolt",
            "type": "spell",
            "data": {
              "description": {
                "value": "<p><span style=\\"color: #191813; font-size: 13px;\\">A bolt of lightning flashes down from the cloud to that point. Each creature within 5 feet of that point must make a Dexterity saving throw. A creature takes 3d10 lightning damage on a failed save, or half as much damage on a successful one.</span></p>"
              },
              "activation": {
                "type": "action"
              },
              "target": {
                "value": 5,
                "width": null,
                "units": "ft",
                "type": "radius"
              },
              "ability": "",
              "actionType": "save",
              "damage": {
                "parts": [
                  [
                    \`\${DAEitem.data.level}d10\`,
                    "lightning"
                  ]
                ],
                "versatile": ""
              },
              "formula": "",
              "save": {
                "ability": "dex",
                "dc": 16,
                "scaling": "spell"
              },
              "level": 0,
              "school": "abj",
              "preparation": {
                "mode": "prepared",
                "prepared": false
              },
              "scaling": {
                "mode": "none",
                "formula": ""
              }
            },
            "img": "systems/dnd5e/icons/spells/lighting-sky-2.jpg",
            "effects" : []
          }
    );
}

// Delete Flame Blade
if (args[0] === "off") {
    let castItem = tactor.data.items.find(i => i.name === "Call Lightning - bolt" && i.type === "spell")
    if(castItem) await tactor.deleteOwnedItem(castItem._id)
    let template = canvas.templates.placeables.find(i => i.data.flags.DAESRD?.CallLighting?.ActorId === tactor.id)
    if (template) await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [template.id])

}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effectCallLightningCallLightningSummon.changes.push(generateMacroChange("@target @item.level"));
  document.effects.push(effectCallLightningCallLightningSummon);

  return document;
}
