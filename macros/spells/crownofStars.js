// DAE Item Macro, pass spell level

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const target = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const castItemName = "Summoned Crown of Stars";

/**
 * Create Crown of Stars item in inventory
 */
if (args[0] === "on") {
  const castItem = target.items.find((i) => i.name === castItemName && i.type === "weapon");
  if (!castItem) {
    const DAEItem = lastArg.efData.flags.dae.itemData;
    const stars = 7 + ((args[1] - 7) * 2);
    const uuid = foundry.utils.randomID();
    const weaponData = {
      _id: uuid,
      name: castItemName,
      type: "weapon",
      system: {
        quantity: 1,
        activation: { type: "bonus", cost: 1, condition: "", },
        target: { value: 1, type: "creature", },
        range: { value: 120, long: null, units: "ft", },
        uses: { value: stars, max: stars, per: "charges", },
        ability: DAEItem.system.ability,
        actionType: "rsak",
        attack: {
          bonus: DAEItem.system.attack.bonus,
        },
        chatFlavor: "",
        critical: null,
        damage: { parts: [["4d12", "radiant"]], versatile: "" },
        type: {
          value: "natural",
        },
        proficient: true,
        equipped: true,
        description: DAEItem.system.description,
        consume: { type: "charges", target: uuid, amount: 1 }
      },
      flags: { CrownOfStars: target.id, ddbimporter: { ignoreItemUpdate: true } },
      img: DAEItem.img,
    };

    await target.createEmbeddedDocuments("Item", [weaponData], { keepId: true });
    ui.notifications.notify("Crown of Stars created in your inventory");
  }
}

// NEEDED: reduce ATL effect to dim light when stars drop below 5

// Delete Crown of Stars
if (args[0] === "off") {
  const blades = target.items.filter((i) => i.flags?.CrownOfStars === target.id);
  if (blades.length > 0) {
    await target.deleteEmbeddedDocuments("Item", blades.map((s) => s.id));
    ui.notifications.notify("Crown of Stars removed from your inventory");
  }
}
