// based on Zhell's macro https://github.com/krbz999/zhell-macros

if (args[0] !== "on") return;

const lastArg = args[args.length - 1];
const tActor = await fromUuid(lastArg.actorUuid);
const feature = await fromUuid(lastArg.origin);

const levels = tActor.getRollData().classes.wizard.levels;
const spellConfig = foundry.utils.duplicate(tActor.system.spells);
const spellLevels = [];

const arcaneGrimoire = tActor.items.some((i) => i.name.startsWith("Arcane Grimoire") && i.system?.equipped && i.system?.attunement === 2);

for (let i = 1; i <= 5; i++) {
  if (spellConfig[`spell${i}`].max > 0) spellLevels.push(spellConfig[`spell${i}`]);
}

if (!spellLevels.some((level) => level.value !== level.max)) {
  ui.notifications.warn("You have no appropriate spell slots to recover");
  return;
}

const totalSpellLevels = Math.ceil(levels / 2) + (arcaneGrimoire ? 1 : 0);
let spent = 0;

const agText = arcaneGrimoire ? "<p><i>Bonus +1 slot from Arcane Grimoire</i></p>" : "";

let content = `<p name="header">Recovering spell slots: <strong>${spent}</strong> / ${totalSpellLevels}.</p> ${agText} <hr> <form>`;
for (let i = 0; i < spellLevels.length; i++) {
  const val = i + 1;
  const name = `level${val}`;
  content += `
  <div class="form-group">
    <label style="text-align:center"><strong>${val.ordinalString()}-level</strong></label>
    <div class="form-fields">`;
  for (let j = 0; j < spellLevels[i].max; j++) {
    const cd = j < spellLevels[i].value ? "checked disabled" : "";
    content += `<input type="checkbox" value="${val}" name="${name}" ${cd}></input>`;
  }
  content += "</div></div>";
}
content += "</form> <hr>";

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
        await tActor.update({ "system.spells": spellConfig });
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
