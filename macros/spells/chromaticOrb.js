const lastArg = args[args.length - 1];

async function selectDamage() {
  const damageTypes = {
    acid: "icons/magic/acid/dissolve-bone-white.webp",
    cold: "icons/magic/water/barrier-ice-crystal-wall-jagged-blue.webp",
    fire: "icons/magic/fire/barrier-wall-flame-ring-yellow.webp",
    lightning: "icons/magic/lightning/bolt-strike-blue.webp",
    poison: "icons/consumables/potions/bottle-conical-fumes-green.webp",
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

if (lastArg.hitTargetUuids.length > 0) {
  const tokenOrActor = await fromUuid(lastArg.actorUuid);
  const casterActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
  const casterToken = await fromUuid(lastArg.tokenUuid);
  const damageType = await selectDamage();
  const targets = await Promise.all(lastArg.hitTargetUuids.map(async (uuid) => await fromUuid(uuid)));
  const baseDamage = 3 + (lastArg.spellLevel - 1);
  const damageDice = lastArg.isCritical ? baseDamage * 2 : baseDamage;
  const critFlavour = lastArg.isCritical ? "CRITICAL! " : "";
  const damageRoll = await new Roll(`${damageDice}d8[${damageType}]`).evaluate({ async: true });
  if (game.dice3d) game.dice3d.showForRoll(damageRoll);
  await new MidiQOL.DamageOnlyWorkflow(
    casterActor,
    casterToken,
    damageRoll.total,
    damageType,
    targets,
    damageRoll,
    {
      flavor: `${critFlavour}(${CONFIG.DND5E.damageTypes[damageType]})`,
      itemCardId: lastArg.itemCardId,
      itemData: lastArg.item,
      isCritical: lastArg.isCritical,
    }
  );
}
