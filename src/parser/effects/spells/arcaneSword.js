import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function arcaneSwordEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = `
if(!game.modules.get("advanced-macros")?.active) {ui.notifications.error("Please enable the Advanced Macros module") ;return;}
//DAE Macro Execute, Effect Value = "Macro Name" @target
const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);

let casterToken = canvas.tokens.get(lastArg.tokenId) || token;
const DAEitem = lastArg.efData.flags.dae.itemData
const saveData = DAEitem.data.save
/**
 * Create Arcane Sword item in inventory
 */
if (args[0] === "on") {
    let image = DAEitem.img;
    let range = canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [{
        t: "circle",
        user: game.user._id,
        x: casterToken.x + canvas.grid.size / 2,
        y: casterToken.y + canvas.grid.size / 2,
        direction: 0,
        distance: 60,
        borderColor: "#FF0000",
        flags: {
            DAESRD: {
                ArcaneSwordRange: {
                    ActorId: tactor.id
                }
            }
        }
        //fillColor: "#FF3366",
    }]);
    range.then(result => {
        let templateData = {
            t: "rect",
            user: game.user.id,
            distance: 7,
            direction: 45,
            x: 0,
            y: 0,
            flags: {
                DAESRD: {
                    ArcaneSword: {
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

        async function deleteTemplates(scene, template) {
            let removeTemplates = canvas.templates.placeables.filter(i => i.data.flags.DAESRD?.ArcaneSwordRange?.ActorId === tactor.id);
            await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [removeTemplates[0].id]);
        };

    })
    await tactor.createOwnedItem(
        {
            "name": "Summoned Arcane Sword",
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
                    "type": "creature"
                },
                "range": {
                    "value": 5,
                    "long": null,
                    "units": ""
                },
                "ability": DAEitem.data.ability,
                "actionType": "msak",
                "attackBonus": "0",
                "chatFlavor": "",
                "critical": null,
                "damage": {
                    "parts": [
                        [
                            \`3d10\`,
                            "force"
                        ]
                    ],
                    "versatile": ""
                },
                "weaponType": "simpleM",
                "proficient": true,
            },
            "flags": {
                "DAESRD": {
                    "ArcaneSword":
                        tactor.id
                }
            },
            "img": image,
        }
    );
    ui.notifications.notify("Weapon created in your inventory")
}

// Delete Arcane Sword
if (args[0] === "off") {
    let sword = tactor.items.find(i => i.data.flags?.DAESRD?.ArcaneSword === tactor.id)
    let template = canvas.templates.placeables.find(i => i.data.flags.DAESRD.ArcaneSword?.ActorId === tactor.id)
    if (sword) await tactor.deleteOwnedItem(sword.id);
    if (template) await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [template.id])
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange("@attributes.spellcasting"));
  document.effects.push(effect);

  return document;
}
