// based on Zhell's macro https://github.com/krbz999/zhell-macros

async function arcaneRecovery(actor, feature) {
  const levels = actor.getRollData().classes.wizard.levels;
  const spellConfig = foundry.utils.duplicate(actor.system.spells);
  const spellLevels = [];

  const arcaneGrimoire = actor.items.some((i) => i.name.toLowerCase().includes("arcane grimoire"));

  for (let i = 1; i <= 5; i++) {
    if (spellConfig[`spell${i}`].max > 0) spellLevels.push(spellConfig[`spell${i}`]);
  }

  if (!spellLevels.some((level) => level.value !== level.max)) {
    ui.notifications.warn("You have no appropriate spell slots to recover");
    return;
  }

  const totalSpellLevels = Math.ceil(levels / 2) + (arcaneGrimoire ? 1 : 0);

  const agText = arcaneGrimoire ? "<p><i>Bonus +1 slot from Arcane Grimoire</i></p>" : "";

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
      spellSlotChoices += `<input type="checkbox" value="${val}" name="${name}" ${cd}></input>`;
    }
    spellSlotChoices += "</div></div>";
  }
  const content = `<p class="ddb-recovery-header">Recovering spell slots: <strong>0</strong> / ${totalSpellLevels}.</p>
${agText} <hr>
${spellSlotChoices}
<hr>`;

  // while loop handles retry when the user selects an invalid number of slots
  while (true) {
    const result = await foundry.applications.api.DialogV2.wait({
      rejectClose: false,
      window: { title: feature.name },
      position: { width: 500 },
      content,
      buttons: [
        {
          action: "recover",
          icon: "fa-solid fa-hat-wizard",
          label: "Recover",
          callback: (_event, _button, dialog) => {
            const inputs = dialog.element.querySelectorAll("input:checked:not(:disabled)");
            const spent = Array.from(inputs).reduce((acc, node) => acc + Number(node.value), 0);
            const checked = {};
            for (let i = 0; i < 9; i++) {
              const selector = `input[name=level${i + 1}]:checked`;
              checked[`spell${i + 1}`] = dialog.element.querySelectorAll(selector).length;
            }
            return { checked, spent };
          },
        },
      ],
      render: (_event, dialog) => {
        dialog.element.addEventListener("change", () => {
          const inputs = dialog.element.querySelectorAll("input:checked:not(:disabled)");
          const spent = Array.from(inputs).reduce((acc, node) => acc + Number(node.value), 0);
          const hint = `Recovering spell slots: <strong>${spent}</strong> / ${totalSpellLevels}.`;
          dialog.element.querySelector(".ddb-recovery-header").innerHTML = hint;
        });
      },
    });

    if (!result) return;

    if (result.spent > totalSpellLevels || result.spent < 1) {
      ui.notifications.warn("Invalid number of slots to recover.");
      continue;
    }

    for (let i = 0; i < 9; i++) {
      spellConfig[`spell${i + 1}`].value = result.checked[`spell${i + 1}`];
    }
    await actor.update({ "system.spells": spellConfig });
    ui.notifications.info("Spell slots recovered!");
    return;
  }
}

if (scope && foundry.utils.getProperty(scope, "flags.ddb-importer.ddbMacroFunction")) {
  if (!actor || ! item) {
    logger.error("No actor or item passed to arcane recovery");
    return;
  }
  await arcaneRecovery(actor, item);
} else if (args && args[0] === "on") {
  const lastArg = args[args.length - 1];
  const tActor = await fromUuid(lastArg.actorUuid);
  const feature = await fromUuid(lastArg.origin);

  await arcaneRecovery(tActor, feature);
}
