if (args[0].tag === "OnUse" && ["preTargeting"].includes(args[0].macroPass)) {
  args[0].workflow.item.system['target']['type'] = "self";
  args[0].workflow.item.system.range = { value: null, units: "self", long: null };
  return;
}

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const target = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

// we see if the equipped weapons have base weapon set and filter on that, otherwise we just get all weapons
const filteredWeapons = target.items
  .filter((i) => i.type === "weapon" && (i.system.type.baseItem === "club" || i.system.type.baseItem === "quarterstaff"));
const weapons = (filteredWeapons.length > 0)
  ? filteredWeapons
  : target.items.filter((i) => i.type === "weapon");

const weaponContent = weapons.map((w) => `<option value=${w.id}>${w.name}</option>`).join("");

if (args[0] === "on") {
  const content = `
<div class="form-group">
 <label>Weapons : </label>
 <select name="weapons">
 ${weaponContent}
 </select>
</div>
`;

  new Dialog({
    title: "Choose a club or quarterstaff",
    content,
    buttons: {
      Ok: {
        label: "Ok",
        callback: async (html) => {
          const itemId = html.find("[name=weapons]")[0].value;
          const weaponItem = target.getEmbeddedDocument("Item", itemId);
          const weaponCopy = foundry.utils.duplicate(weaponItem);
          await DAE.setFlag(target, "shillelagh", {
            id: itemId,
            name: weaponItem.name,
            damage: weaponItem.system.damage.parts[0][0],
            ability: weaponItem.system.ability,
            magical: foundry.utils.getProperty(weaponItem, "system.properties.mgc") || false,
          });
          const damage = weaponCopy.system.damage.parts[0][0];
          const targetAbilities = target.system.abilities;
          weaponCopy.system.damage.parts[0][0] = damage.replace(/1d(4|6)/g, "1d8");
          if (targetAbilities.wis.value > targetAbilities.str.value) weaponCopy.system.ability = "wis";
          weaponCopy.name = weaponItem.name + " [Shillelagh]";
          foundry.utils.setProperty(weaponCopy, "system.properties.mgc", true);
          await target.updateEmbeddedDocuments("Item", [weaponCopy]);
          await ChatMessage.create({
            content: weaponCopy.name + " is empowered by Shillelagh",
          });
        },
      },
      Cancel: {
        label: "Cancel",
      },
    },
  }).render(true);
}

if (args[0] === "off") {
  const flag = DAE.getFlag(target, "shillelagh");
  const weaponItem = target.getEmbeddedDocument("Item", flag.id);
  const weaponCopy = foundry.utils.duplicate(weaponItem);
  weaponCopy.system.damage.parts[0][0] = flag.damage;
  weaponCopy.system.ability = flag.ability;
  weaponCopy.name = flag.name;
  foundry.utils.setProperty(weaponCopy, "system.properties.mgc", flag.magical);
  await target.updateEmbeddedDocuments("Item", [weaponCopy]);
  await DAE.unsetFlag(target, "shillelagh");
  await ChatMessage.create({ content: weaponCopy.name + " returns to normal" });
}
