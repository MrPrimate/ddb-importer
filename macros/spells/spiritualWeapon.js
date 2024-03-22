const lastArg = args[args.length - 1];
const castItemName = "Summoned Spiritual Weapon";
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;


async function deleteTemplates(actorId) {
  let removeTemplates = canvas.templates.placeables.filter(
    (i) => i.data.flags?.SpiritualWeaponRange?.ActorId === actorId
  );
  await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", removeTemplates.map((t) => t.id));
}

/**
 * Create Spiritual Weapon item in inventory
 */
if (args[0] === "on") {
  const tokenFromUuid = await fromUuid(lastArg.tokenUuid);
  const targetToken = tokenFromUuid.data || token;
  const DAEItem = lastArg.efData.flags.dae.itemData;
  const damage = Math.floor(Math.floor(args[1] / 2));
  // draw range template
  await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [
    {
      t: "circle",
      user: game.userId,
      x: targetToken.x + (canvas.grid.size / 2),
      y: targetToken.y + (canvas.grid.size / 2),
      direction: 0,
      distance: 60,
      borderColor: "#FF0000",
      flags: {
        SpiritualWeaponRange: {
          ActorId: targetActor.id,
        },
      },
    },
  ]);

  const templateData = {
    t: "rect",
    user: game.user.id,
    distance: 7,
    direction: 45,
    x: 0,
    y: 0,
    flags: {
      SpiritualWeapon: {
        ActorId: targetActor.id,
      },
    },
    fillColor: game.user.color,
    texture: DAEItem.img,
  };
  Hooks.once("createMeasuredTemplate", () => deleteTemplates(targetActor.id));
  const doc = new CONFIG.MeasuredTemplate.documentClass(templateData, { parent: canvas.scene });
  let template = new game.dnd5e.canvas.AbilityTemplate(doc);
  template.actorSheet = targetActor.sheet;
  template.drawPreview();

  const castItem = targetActor.items.find((i) => i.name === castItemName && i.type === "weapon");
  if (!castItem) {
    const weaponData = {
      name: castItemName,
      type: "weapon",
      system: {
        quantity: 1,
        activation: { type: "bonus", cost: 1, condition: "", },
        target: { value: 1, type: "creature", },
        // we choose 60ft here in case the midi-check range is on
        range: { value: 60, long: null, units: "ft", },
        ability: DAEItem.system.ability,
        attack: {
          bonus: DAEItem.system.attack.bonus,
        },
        actionType: "msak",
        chatFlavor: "",
        critical: null,
        damage: { parts: [[`${damage}d8+@mod`, "force"]], versatile: "" },
        type: {
          value: "simpleM",
        },
        proficient: true,
        properties: ["mgc"],
        equipped: true,
      },
      flags: { SpiritualWeapon: targetActor.id, ddbimporter: { ignoreItemUpdate: true } },
      img: DAEItem.img,
    };

    await targetActor.createEmbeddedDocuments("Item", [weaponData]);
    ui.notifications.notify("Weapon created in your inventory");
  }
}

// Delete Spiritual Weapon
if (args[0] === "off") {
  let swords = targetActor.items.filter((i) => i.flags?.SpiritualWeapon === targetActor.id);
  if (swords.length > 0) await targetActor.deleteEmbeddedDocuments("Item", swords.map((s) => s.id));
  const templates = canvas.templates.placeables.filter((i) => i.data.flags?.SpiritualWeapon?.ActorId === targetActor.id);
  if (templates.length > 0) await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", templates.map((t) => t.id));
}
