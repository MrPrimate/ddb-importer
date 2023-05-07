const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const content = `
<style>
  .protEnergy .form-group {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    align-items: flex-start;
  }
  .protEnergy .radio-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    justify-items: center;
    flex: 1 0 20%;
    line-height: normal;
  }
  .protEnergy .radio-label input {
    display: none;
  }
  .protEnergy img {
    border: 0px;
    width: 50px;
    height: 50px;
    flex: 0 0 50px;
    cursor: pointer;
  }
  /* CHECKED STYLES */
  .protEnergy [type="radio"]:checked + img {
    outline: 2px solid #f00;
  }
</style>
<form class="protEnergy">
  <div class="form-group" id="types">
    <label class="radio-label">
      <input type="radio" name="type" value="acid" />
      <img
        src="icons/magic/acid/dissolve-bone-white.webp"
        style="border: 0px; width: 50px; height: 50px"
      />
      Acid
    </label>
    <label class="radio-label">
      <input type="radio" name="type" value="cold" />
      <img
        src="icons/magic/water/barrier-ice-crystal-wall-jagged-blue.webp"
        style="border: 0px; width: 50px; height: 50px"
      />
      Cold
    </label>
    <label class="radio-label">
      <input type="radio" name="type" value="fire" />
      <img
        src="icons/magic/fire/barrier-wall-flame-ring-yellow.webp"
        style="border: 0px; width: 50px; height: 50px"
      />
      Fire
    </label>
    <label class="radio-label">
      <input type="radio" name="type" value="lightning" />
      <img
        src="icons/magic/lightning/bolt-strike-blue.webp"
        style="border: 0px; width: 50px; height: 50px"
      />
      Lighting
    </label>
    <label class="radio-label">
      <input type="radio" name="type" value="thunder" />
      <img
        src="icons/magic/sonic/explosion-shock-wave-teal.webp"
        style="border: 0px; width: 50px; height: 50px"
      />
      Thunder
    </label>
  </div>
</form>
`;
if (args[0] === "on") {
  new Dialog({
    title: 'Choose a damage type',
    content: content,
    buttons: {
      yes: {
        icon: '<i class="fas fa-check"></i>',
        label: 'Protect!',
        callback: async () => {
          const element = $("input[type='radio'][name='type']:checked").val();
          const effect = targetActor.effects.find((e) => (e.name ?? e.label) === (lastArg.efData.name ?? lastArg.efData.label));
          const changes = [
            {
              key: "data.traits.dr.value",
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
              priority: 30,
              value: element,
            },
          ];
          await effect.update({ changes: changes.concat(effect.changes) });
          await DAE.setFlag(targetActor, "protectionFromEnergySpell", element);
          ChatMessage.create({ content: `${targetActor.name} gains resistance to ${element}` });
        }
      },
    },
  }).render(true, { width: 400 });
}
if (args[0] === "off") {
  const element = DAE.getFlag(targetActor, 'protectionFromEnergySpell');
  await DAE.unsetFlag(targetActor, 'protectionFromEnergySpell');
  ChatMessage.create({ content: `${targetActor.name} loses resistance to ${element}` });
}
