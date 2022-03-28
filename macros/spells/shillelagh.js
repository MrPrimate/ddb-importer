const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const target = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

// we see if the equipped weapons have base weapon set and filter on that, otherwise we just get all weapons
const filteredWeapons = target.items
  .filter((i) => i.data.type === "weapon" && (i.data.data.baseItem === "club" || i.data.data.baseItem === "quarterstaff"));
const weapons = (filteredWeapons.length > 0)
  ? filteredWeapons
  : target.items.filter((i) => i.data.type === "weapon");

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
          const weaponCopy = duplicate(weaponItem);
          await DAE.setFlag(target, "shillelagh", {
            id: itemId,
            name: weaponItem.name,
            damage: weaponItem.data.data.damage.parts[0][0],
            ability: weaponItem.data.data.ability,
            magical: getProperty(weaponItem, "data.properties.mgc") || false,
          });
          const damage = weaponCopy.data.damage.parts[0][0];
          const targetAbilities = target.data.data.abilities;
          weaponCopy.data.damage.parts[0][0] = damage.replace(/1d(4|6)/g, "1d8");
          if (targetAbilities.wis.value > targetAbilities.str.value) weaponCopy.data.ability = "wis";
          weaponCopy.name = weaponItem.name + " [Shillelagh]";
          setProperty(weaponCopy, "data.properties.mgc", true);
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
  const weaponCopy = duplicate(weaponItem);
  weaponCopy.data.damage.parts[0][0] = flag.damage;
  weaponCopy.data.ability = flag.ability;
  weaponCopy.name = flag.name;
  setProperty(weaponCopy, "data.properties.mgc", flag.magical);
  await target.updateEmbeddedDocuments("Item", [weaponCopy]);
  await DAE.unsetFlag(target, "shillelagh");
  await ChatMessage.create({ content: weaponCopy.name + " returns to normal" });
}
