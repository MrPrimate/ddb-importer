import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function callLightningEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = `
//DAE Macro no arguments passed
if (!game.modules.get("advanced-macros")?.active) ui.notifications.error("Please enable the Advanced Macros module");

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const DAEitem = lastArg.efData.flags.dae.itemData;
const saveData = DAEitem.data.save;
const castItemName = "Call Lightning - bolt";
const castItem = targetActor.data.items.find((i) => i.name === castItemName && i.type === "spell");

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
          ActorId: targetActor.id,
        },
      },
    },
    fillColor: game.user.color,
  };
  let doc = new CONFIG.MeasuredTemplate.documentClass(templateData, {
    parent: canvas.scene,
  });
  let template = new game.dnd5e.canvas.AbilityTemplate(doc);
  template.actorSheet = targetActor.sheet;
  template.drawPreview();

  if (!castItem) {
    const spell = {
      name: castItemName,
      type: "spell",
      data: {
        description: DAEitem.data.description,
        activation: { type: "action", },
        target: { value: 5, width: null, units: "ft", type: "radius", },
        ability: DAEitem.data.ability,
        attackBonus: DAEitem.data.attackBonus,
        actionType: "save",
        damage: { parts: [[\`\${DAEitem.data.level}d10\`, "lightning"]], versatile: "", },
        formula: "",
        save: { ability: "dex", dc: null, scaling: "spell" },
        level: 0,
        school: DAEitem.data.school,
        preparation: { mode: "prepared", prepared: false, },
        scaling: { mode: "none", formula: "", },
      },
      img: "systems/dnd5e/icons/spells/lighting-sky-2.jpg",
      effects: [],
    };
    await targetActor.createEmbeddedDocuments("Item", [spell]);
    ui.notifications.notify("Spell Bolt attack created in your spellbook");
  }
}

// Delete Lighting bolt
if (args[0] === "off") {
  if (castItem) await targetActor.deleteEmbeddedDocuments("Item", castItem._id);
  const template = canvas.templates.placeables.find((i) => i.data.flags.DAESRD?.CallLighting?.ActorId === targetActor.id);
  if (template) await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [template.id]);
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  document.effects.push(effect);
  setProperty(document, "data.actionType", "other");

  return document;
}
