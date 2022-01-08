import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function spiritualWeaponEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  // MACRO START
  const itemMacroText = `
if (!game.modules.get("advanced-macros")?.active) {
  ui.notifications.error("Please enable the Advanced Macros module");
  return;
}
const lastArg = args[args.length - 1];
const castItemName = "Summoned Spiritual Weapon";
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const target = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

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
  const tokenFromUuid  = await fromUuid(lastArg.tokenUuid);
  const casterToken = tokenFromUuid.data || token;
  const DAEItem = lastArg.efData.flags.dae.itemData;
  const damage = Math.floor(Math.floor(args[1]/ 2));
  // draw range template
  await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [
    {
      t: "circle",
      user: game.user._id,
      x: casterToken.x + canvas.grid.size / 2,
      y: casterToken.y + canvas.grid.size / 2,
      direction: 0,
      distance: 60,
      borderColor: "#FF0000",
      flags: {
        SpiritualWeaponRange: {
          ActorId: target.id,
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
        ActorId: target.id,
      },
    },
    fillColor: game.user.color,
    texture: DAEItem.img,
  };
  Hooks.once("createMeasuredTemplate", () => deleteTemplates(target.id));
  const doc = new CONFIG.MeasuredTemplate.documentClass(templateData, { parent: canvas.scene });
  let template = new game.dnd5e.canvas.AbilityTemplate(doc);
  template.actorSheet = target.sheet;
  template.drawPreview();

  const castItem = target.data.items.find((i) => i.name === castItemName && i.type === "weapon");
  if (!castItem) {
    const weaponData = {
      name: castItemName,
      type: "weapon",
      data: {
        quantity: 1,
        activation: { type: "action", cost: 1, condition: "", },
        target: { value: 1, type: "creature", },
        range: { value: 5, long: null, units: "", },
        ability: DAEItem.data.ability,
        attackBonus: DAEItem.data.attackBonus,
        actionType: "msak",
        chatFlavor: "",
        critical: null,
        damage: { parts: [[\`\${damage}d8+@mod\`, "force"]], versatile: "" },
        weaponType: "simpleM",
        proficient: true,
      },
      flags: { SpiritualWeapon: target.id },
      img: DAEItem.img,
    };

    await target.createEmbeddedDocuments("Item", [weaponData]);
    ui.notifications.notify("Weapon created in your inventory");
  }
}

// Delete Spiritual Weapon
if (args[0] === "off") {
  let swords = target.data.items.filter((i) => i.data.flags?.SpiritualWeapon === target.id);
  if (swords.length > 0) await target.deleteEmbeddedDocuments("Item", swords.map((s) => s.id));
  const templates = canvas.templates.placeables.filter((i) => i.data.flags?.SpiritualWeapon?.ActorId === target.id);
  if (templates.length > 0) await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", templates.map((t) => t.id));
}

`;
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange("@item.level"));
  document.effects.push(effect);

  document.data.damage = { parts: [], versatile: "", value: "" };
  document.data['target']['type'] = "self";
  document.data.range = { value: null, units: "self", long: null };
  document.data.actionType = "other";

  return document;
}
