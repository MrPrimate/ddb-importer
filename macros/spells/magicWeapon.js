const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

function valueLimit(val, min, max) {
  return val < min ? min : val > max ? max : val;
}

/**
 * Select for weapon and apply bonus based on spell level
 */
if (args[0] === "on") {
  const weapons = targetActor.items.filter((i) => i.type === "weapon");
  let weaponContent = "";

  // Filter for weapons
  weapons.forEach((weapon) => {
    weaponContent += `<label class="radio-label">
  <input type="radio" name="weapon" value="${weapon.id}">
  <img src="${weapon.img}" style="border:0px; width: 50px; height:50px;">
  ${weapon.name}
</label>`;
  });

  const content = `
    <style>
    .magicWeapon .form-group {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        align-items: flex-start;
      }

      .magicWeapon .radio-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        justify-items: center;
        flex: 1 0 25%;
        line-height: normal;
      }

      .magicWeapon .radio-label input {
        display: none;
      }

      .magicWeapon img {
        border: 0px;
        width: 50px;
        height: 50px;
        flex: 0 0 50px;
        cursor: pointer;
      }

      /* CHECKED STYLES */
      .magicWeapon [type=radio]:checked + img {
        outline: 2px solid #f00;
      }
    </style>
    <form class="magicWeapon">
      <div class="form-group" id="weapons">
          ${weaponContent}
      </div>
    </form>
`;

  new Dialog({
    content,
    buttons: {
      ok: {
        label: `Ok`,
        callback: () => {
          const itemId = $("input[type='radio'][name='weapon']:checked").val();
          const weaponItem = targetActor.items.get(itemId);
          let copyItem = duplicate(weaponItem);
          const spellLevel = Math.floor(args[1] / 2);
          const bonus = valueLimit(spellLevel, 1, 3);
          const wpDamage = copyItem.system.damage.parts[0][0];
          const verDamage = copyItem.system.damage.versatile;
          DAE.setFlag(targetActor, "magicWeapon", {
            damage: weaponItem.system.attackBonus,
            weapon: itemId,
            weaponDmg: wpDamage,
            verDmg: verDamage,
            mgc: copyItem.system.properties.mgc,
          });
          if (copyItem.system.attackBonus === "") copyItem.system.attackBonus = "0";
          copyItem.system.attackBonus = `${parseInt(copyItem.system.attackBonus) + bonus}`;
          copyItem.system.damage.parts[0][0] = wpDamage + " + " + bonus;
          copyItem.system.properties.mgc = true;
          if (verDamage !== "" && verDamage !== null) copyItem.system.damage.versatile = verDamage + " + " + bonus;
          targetActor.updateEmbeddedDocuments("Item", [copyItem]);
        },
      },
      cancel: {
        label: `Cancel`,
      },
    },
  }).render(true);
}

// Revert weapon and unset flag.
if (args[0] === "off") {
  const { damage, weapon, weaponDmg, verDmg, mgc } = DAE.getFlag(targetActor, "magicWeapon");
  const weaponItem = targetActor.items.get(weapon);
  let copyItem = duplicate(weaponItem);
  copyItem.system.attackBonus = damage;
  copyItem.system.damage.parts[0][0] = weaponDmg;
  copyItem.system.properties.mgc = mgc;
  if (verDmg !== "" && verDmg !== null) copyItem.system.damage.versatile = verDmg;
  targetActor.updateEmbeddedDocuments("Item", [copyItem]);
  DAE.unsetFlag(targetActor, "magicWeapon");
}
