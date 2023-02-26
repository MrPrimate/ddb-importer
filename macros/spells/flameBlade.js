if (args[0].tag === "OnUse" && ["preTargeting"].includes(args[0].macroPass)) {
  args[0].workflow.item.system['target']['type'] = "self";
  args[0].workflow.item.system.range = { value: null, units: "self", long: null };
  return;
}

// DAE Item Macro, pass spell level
const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const target = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const castItemName = "Summoned Flame Blade";

/**
 * Create Flame Blade item in inventory
 */
if (args[0] === "on") {
  const castItem = target.items.find((i) => i.name === castItemName && i.type === "weapon");
  if (!castItem) {
    const DAEItem = lastArg.efData.flags.dae.itemData;
    const weaponDamage = 2 + Math.floor(args[1] / 2);
    const weaponData = {
      name: castItemName,
      type: "weapon",
      data: {
        quantity: 1,
        activation: { type: "action", cost: 1, condition: "", },
        target: { value: 1, type: "creature", },
        range: { value: 5, long: null, units: "", },
        ability: DAEItem.system.ability,
        actionType: "msak",
        attackBonus: DAEItem.system.attackBonus,
        chatFlavor: "",
        critical: null,
        damage: { parts: [[`${weaponDamage}d6`, "fire"]], versatile: "" },
        weaponType: "simpleM",
        proficient: true,
        equipped: true,
        description: DAEItem.system.description,
      },
      flags: { FlameBlade: target.id },
      img: DAEItem.img,
    };

    await target.createEmbeddedDocuments("Item", [weaponData]);
    ui.notifications.notify("Flame Blade created in your inventory");
  }
}

// Delete Flame Blade
if (args[0] === "off") {
  const blades = target.items.filter((i) => i.flags?.FlameBlade === target.id);
  if (blades.length > 0) {
    await target.deleteEmbeddedDocuments("Item", blades.map((s) => s.id));
    ui.notifications.notify("Flame Blade removed from your inventory");
  }
}
