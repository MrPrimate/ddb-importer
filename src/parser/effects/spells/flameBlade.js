import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function flameBladeEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  // MACRO START
  const itemMacroText = `
//DAE Item Macro, no arguments passed
if (!game.modules.get("advanced-macros")?.active) ui.notifications.error("Please enable the Advanced Macros module")

const lastArg = args[args.length-1]
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const target = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const castItemName = "Summoned Flame Blade";

/**
 * Create Flame Blade item in inventory
 */
if (args[0] === "on") {
  const castItem = target.data.items.find((i) => i.name === castItemName && i.type === "weapon");
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
        ability: DAEItem.data.ability,
        actionType: "msak",
        attackBonus: DAEItem.data.attackBonus,
        chatFlavor: "",
        critical: null,
        damage: { parts: [[\`\${weaponDamage}d6\`, "fire"]], versatile: "" },
        weaponType: "simpleM",
        proficient: true,
        description: DAEItem.data.description,
      },
      flags: { FlameBlade: target.id },
      img: DAEItem.img,
    };

    await target.createEmbeddedDocuments("Item", [weaponData]);
    ui.notifications.notify("Weapon created in your inventory");
  }

  ui.notifications.notify("Flame Blade added to your inventory")
}

// Delete Flame Blade
if (args[0] === "off") {
  const blades = target.data.items.filter((i) => i.data.flags?.FlameBlade === target.id);
  if (blades.length > 0) {
    await target.deleteEmbeddedDocuments("Item", [blades.map((s) => s.id)]);
    ui.notifications.notify("Flame Blade removed from your inventory");
  }
}
`;
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange("@spellLevel"));
  document.data.damage = { parts: [], versatile: "", value: "" };
  document.data['target']['type'] = "self";
  document.data.range = { value: null, units: "self", long: null };
  document.data.actionType = "other";
  document.effects.push(effect);

  return document;
}
