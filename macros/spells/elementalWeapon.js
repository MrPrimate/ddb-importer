const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const DAEItem = lastArg.efData.flags.dae.itemData;

function valueLimit(val, min, max) {
  return val < min ? min : val > max ? max : val;
}


async function selectDamage() {
  const damageTypes = {
    acid: "icons/magic/acid/dissolve-bone-white.webp",
    cold: "icons/magic/water/barrier-ice-crystal-wall-jagged-blue.webp",
    fire: "icons/magic/fire/barrier-wall-flame-ring-yellow.webp",
    lightning: "icons/magic/lightning/bolt-strike-blue.webp",
    thunder: "icons/magic/sonic/explosion-shock-wave-teal.webp",
  };
  function generateEnergyBox(type) {
    return `
<label class="radio-label">
  <input type="radio" name="type" value="${type}" />
  <img src="${damageTypes[type]}" style="border: 0px; width: 50px; height: 50px"/>
  ${type.charAt(0).toUpperCase() + type.slice(1)}
</label>
`;
  }
  const damageSelection = Object.keys(damageTypes).map((type) => generateEnergyBox(type)).join("\n");
  const content = `
<style>
  .chromOrb .form-group {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    align-items: flex-start;
  }
  .chromOrb .radio-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    justify-items: center;
    flex: 1 0 20%;
    line-height: normal;
  }
  .chromOrb .radio-label input {
    display: none;
  }
  .chromOrb img {
    border: 0px;
    width: 50px;
    height: 50px;
    flex: 0 0 50px;
    cursor: pointer;
  }
  /* CHECKED STYLES */
  .chromOrb [type="radio"]:checked + img {
    outline: 2px solid #f00;
  }
</style>
<form class="chromOrb">
  <div class="form-group" id="types">
    ${damageSelection}
  </div>
</form>
`;
  const damageType = await new Promise((resolve) => {
    new Dialog({
      title: "Choose a damage type",
      content,
      buttons: {
        ok: {
          label: "Choose!",
          callback: async (html) => {
            const element = html.find("input[type='radio'][name='type']:checked").val();
            resolve(element);
          },
        },
      },
    }).render(true);
  });
  return damageType;
}

/**
 * Select for weapon and apply bonus based on spell level
 */
if (args[0] === "on") {
  const weapons = targetActor.items.filter((i) => i.data.type === "weapon" && !i.data.data.properties.mgc);
  let weapon_content = "";

  //Filter for weapons
  weapons.forEach((weapon) => {
    weapon_content += `<label class="radio-label">
  <input type="radio" name="weapon" value="${weapon.id}">
  <img src="${weapon.img}" style="border:0px; width: 50px; height:50px;">
  ${weapon.data.name}
</label>`;
  });

  let content = `
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
          ${weapon_content}
      </div>
    </form>
`;

  new Dialog({
    content,
    buttons: {
      ok: {
        label: `Ok`,
        callback: async (html) => {
          const itemId = $("input[type='radio'][name='weapon']:checked").val();
          const weaponItem = targetActor.items.get(itemId);
          let copyItem = duplicate(weaponItem);
          const spellLevel = Math.floor(args[1] / 2);
          const bonus = valueLimit(spellLevel, 1, 3);
          const wpDamage = copyItem.data.damage.parts[0][0];
          const verDamage = copyItem.data.damage.versatile;
          DAE.setFlag(targetActor, "magicWeapon", {
            name: weaponItem.data.name,
            attackBonus: weaponItem.data.data.attackBonus,
            weapon: itemId,
            damage: weaponItem.data.data.damage,
            mgc: copyItem.data.properties.mgc,
          });
          copyItem.name = `${weaponItem.data.name} (Elemental Weapon)`;
          if (copyItem.data.attackBonus === "") copyItem.data.attackBonus = "0";
          copyItem.data.attackBonus = `${parseInt(copyItem.data.attackBonus) + bonus}`;
          copyItem.data.damage.parts[0][0] = wpDamage + " + " + bonus;
          copyItem.data.properties.mgc = true;
          if (verDamage !== "" && verDamage !== null) copyItem.data.damage.versatile = verDamage + " + " + bonus;

          const damageType = await selectDamage();
          copyItem.data.damage.parts.push([`${bonus}d4[${damageType}]`, damageType]);
          targetActor.updateEmbeddedDocuments("Item", [copyItem]);
        },
      },
      cancel: {
        label: `Cancel`,
      },
    },
  }).render(true);
}

//Revert weapon and unset flag.
if (args[0] === "off") {
  const { name, attackBonus, weapon, damage, mgc } = DAE.getFlag(targetActor, "magicWeapon");
  const weaponItem = targetActor.items.get(weapon);
  let copyItem = duplicate(weaponItem);
  copyItem.name = name;
  copyItem.data.attackBonus = attackBonus;
  copyItem.data.damage= damage;
  copyItem.data.properties.mgc = mgc;
  targetActor.updateEmbeddedDocuments("Item", [copyItem]);
  DAE.unsetFlag(targetActor, "magicWeapon");
}
