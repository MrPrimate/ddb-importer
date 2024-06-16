// based on Zhell's macro https://github.com/krbz999/zhell-macros

function spellRefueling(actor, feature) {
  const spellConfig = foundry.utils.duplicate(actor.system.spells);
  const spellLevels = [];

  for (let i = 1; i <= 3; i++) {
    if (spellConfig[`spell${i}`].max > 0) spellLevels.push(spellConfig[`spell${i}`]);
  }

  if (!spellLevels.some((level) => level.value !== level.max)) {
    ui.notifications.warn("You have no appropriate spell slots to recover");
    return;
  }

  const totalSpellLevels = 1;
  let spent = 0;

  let spellSlotChoices = "";
  for (let i = 0; i < spellLevels.length; i++) {
    const val = i + 1;
    const name = `level${val}`;
    spellSlotChoices += `
    <div class="form-group">
      <label style="text-align:center"><strong>${val.ordinalString()}-level</strong></label>
      <div class="form-fields">`;
    for (let j = 0; j < spellLevels[i].max; j++) {
      const cd = j < spellLevels[i].value ? "checked disabled" : "";
      spellSlotChoices += `<input type="checkbox" value="1" name="${name}" ${cd}></input>`;
    }
    spellSlotChoices += "</div></div>";
  }
  let content = `<p name="header">Recovering spell slots: <strong>${spent}</strong> / ${totalSpellLevels}.</p>
<hr> <form>
${spellSlotChoices}
</form> <hr>`;

  const dialog = new Dialog({
    title: feature.name,
    content,
    buttons: {
      go: {
        icon: `<i class="fa-solid fa-hat-wizard"></i>`,
        label: "Recover",
        callback: async (html) => {
          if (spent > totalSpellLevels || spent < 1) {
            ui.notifications.warn("Invalid number of slots to recover.");
            return dialog.render(true);
          }
          for (let i = 0; i < 9; i++) {
            const selector = `input[name=level${i + 1}]:checked`;
            const val = html[0].querySelectorAll(selector).length;
            spellConfig[`spell${i + 1}`].value = val;
          }
          await actor.update({ "system.spells": spellConfig });
          ui.notifications.info("Spell slots recovered!");
        },
      },
    },
    render: (html) => {
      html[0].addEventListener("change", function () {
        const selector = "input:checked:not(:disabled)";
        const inputs = html[0].querySelectorAll(selector);
        spent = Array.from(inputs).reduce((acc, node) => {
          return acc + Number(node.value);
        }, 0);
        const hint = `Recovering spell slots: <strong>${spent}</strong> / ${totalSpellLevels}.`;
        html[0].querySelector("[name=header]").innerHTML = hint;
      });
    },
  }).render(true);

}

if (scope && foundry.utils.getProperty(scope, "flags.ddb-importer.ddbMacroFunction")) {
  if (!actor || ! item) {
    logger.error("No actor or item passed to arcane recovery");
    return;
  }
  spellRefueling(actor, item);
} else if (args && args[0] === "on") {
  const lastArg = args[args.length - 1];
  const tActor = await fromUuid(lastArg.actorUuid);
  const feature = await fromUuid(lastArg.origin);

  spellRefueling(tActor, feature);
}
