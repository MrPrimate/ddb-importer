if (!game.modules.get("advanced-macros")?.active) { ui.notifications.error("Advanced Macros is not enabled"); return; }

const lastArg = args[args.length - 1];

const castItemName = "Storm Sphere Attack";
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const castItem = targetActor.data.items.find((i) => i.name === castItemName && i.type === "spell");

if (args[0].tag === "OnUse") {
  await AAhelpers.applyTemplate(args);
  // place templates
  const spellLevel = lastArg.spellLevel;
  const DAEItem = lastArg.itemData;

  if (!castItem) {
    const spell = {
      name: castItemName,
      type: "spell",
      data: {
        description: DAEItem.data.description,
        activation: { type: "bonus", },
        ability: DAEItem.data.ability,
        attackBonus: DAEItem.data.attackBonus,
        actionType: "rsak",
        damage: { parts: [[`${spellLevel}d6[lightning]`, "lightning"]], versatile: "", },
        level: 0,
        school: DAEItem.data.school,
        preparation: { mode: "prepared", prepared: false, },
        scaling: { mode: "none", formula: "", },
      },
      img: DAEItem.img,
      effects: [],
    };
    await targetActor.createEmbeddedDocuments("Item", [spell]);
    ui.notifications.notify(`${castItemName} created in your spellbook`);
    const effectData = [{
      label: castItemName,
      icon: DAEItem.img,
      duration: { min: 10, startTime: game.time.worldTime },
      origin: lastArg.sourceItemUuid,
      changes: [{
        key: "macro.itemMacro",
        value: "",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        priority: 20,
      }],
      disabled: false,
    }];
    await targetActor.createEmbeddedDocuments("ActiveEffect", effectData);
  }
}

if (args[0] == "off") {
  // Delete Storm Sphere Attack
  if (castItem) targetActor.deleteEmbeddedDocuments("Item", [castItem.id]);
}
