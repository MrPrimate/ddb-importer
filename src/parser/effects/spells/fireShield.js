import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function fireShieldEffect(document) {
  let effectFireShieldFireShield = baseSpellEffect(document, document.name);
  const itemMacroText = `
// DAE Macro, no arguments passed

const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);
const target = canvas.tokens.get(lastArg.tokenId)


if (args[0] === "on") {  
        new Dialog({
            title: "Warm or Cold Shield",
            buttons: {
                one: {
                    label: "Warm",
                    callback: async () => {
                        let resistances = duplicate(tactor.data.data.traits.dr.value);
                        resistances.push("cold");
                        await tactor.update({ "data.traits.dr.value": resistances });
                        await DAE.setFlag(tactor, 'FireShield', "cold");
                        ChatMessage.create({ content: \`\${target.name} gains resistnace to cold\` });
                        await tactor.createEmbeddedDocuments("Item", [{
                            "name": "Summoned Fire Shield",
                            "type": "weapon",
                            "img": "systems/dnd5e/icons/spells/protect-red-3.jpg",
                            "data": {
                              "source": "Fire Shield Spell",
                              "activation": {
                                "type": "special",
                                "cost": 0,
                                "condition": "whenever a creature within 5 feet of you hits you with a melee Attack"
                              },
                              "actionType": "other",
                              "damage": {
                                "parts": [
                                  [
                                    "2d8",
                                    "fire"
                                  ]
                                ]
                              },
                              "weaponType": "natural"
                            },
                            "effects": []
                          }])
                    }
                },
                two: {
                    label: "Cold",
                    callback: async () => {
                        let resistances = duplicate(tactor.data.data.traits.dr.value);
                        resistances.push("fire");
                        await tactor.update({ "data.traits.dr.value": resistances });
                        await DAE.setFlag(tactor, 'FireShield', "fire");
                        ChatMessage.create({ content: \`\${target.name} gains resistance to fire\` });
                        await tactor.createEmbeddedDocuments("Item", [{
                            "name": "Summoned Fire Shield",
                            "type": "weapon",
                            "img": "systems/dnd5e/icons/spells/protect-blue-3.jpg",
                            "data": {
                              "source": "Fire Shield Spell",
                              "activation": {
                                "type": "special",
                                "cost": 0,
                                "condition": "whenever a creature within 5 feet of you hits you with a melee Attack"
                              },
                              "actionType": "other",
                              "damage": {
                                "parts": [
                                  [
                                    "2d8",
                                    "cold"
                                  ]
                                ]
                              },
                              "weaponType": "natural"
                            },
                            "effects": []
                          }])
                    }
                },
            }
        }).render(true);
}
if (args[0] === "off") {
    let item = tactor.items.getName("Summoned Fire Shield")
    let element = DAE.getFlag(tactor, 'FireShield');
    let resistances = tactor.data.data.traits.dr.value;
    const index = resistances.indexOf(element);
    resistances.splice(index, 1);
    await tactor.update({ "data.traits.dr.value": resistances });
    ChatMessage.create({ content: "Fire Shield expires on " + target.name});
    await DAE.unsetFlag(tactor, 'FireShield');
    await tactor.deleteEmbeddedDocuments("Item", [item.id])

}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effectFireShieldFireShield.changes.push(generateMacroChange("", 0));
  document.effects.push(effectFireShieldFireShield);

  return document;
}
