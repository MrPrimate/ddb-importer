if (args[0].tag === "OnUse" && ["preTargeting"].includes(args[0].macroPass)) {
  args[0].workflow.item.system['target']['type'] = "self";
  args[0].workflow.item.system.range = { value: null, units: "self", long: null };
  return;
}

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const DAEItem = lastArg.efData.flags.dae.itemData;
const castItemName = "Call Lightning - Bolt";
const castItem = targetActor.items.find((i) => i.name === castItemName && i.type === "spell");

/**
 * Create Call Lightning Bolt item in inventory
 */
if (args[0] === "on") {
  const templateData = {
    t: "circle",
    user: game.userId,
    distance: 60,
    direction: 0,
    x: 0,
    y: 0,
    flags: {
      spellEffects: {
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
      system: {
        description: DAEItem.system.description,
        activation: { type: "action", },
        target: { value: 5, width: null, units: "ft", type: "radius", },
        ability: DAEItem.system.ability,
        attack: {
          bonus: DAEItem.system.attack.bonus,
        },
        actionType: "save",
        damage: { parts: [[`${args[1]}d10`, "lightning"]], versatile: "", },
        formula: "",
        save: { ability: "dex", dc: null, scaling: "spell" },
        level: 0,
        school: DAEItem.system.school,
        preparation: { mode: "prepared", prepared: false, },
        scaling: { mode: "none", formula: "", },
      },
      img: DAEItem.img,
      flags: { ddbimporter: { ignoreItemUpdate: true } },
      effects: [],
    };
    await targetActor.createEmbeddedDocuments("Item", [spell]);
    ui.notifications.notify("Spell Bolt attack created in your spellbook");
  }
}

// Delete Lighting bolt
if (args[0] === "off") {
  if (castItem) await targetActor.deleteEmbeddedDocuments("Item", [castItem._id]);
  const template = canvas.templates.placeables.find((i) => i.flags.spellEffects?.CallLighting?.ActorId === targetActor.id);
  if (template) await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [template.id]);
}
