if (!["mwak", "rwak", "msak", "rsak"].includes(args[0].item.system.actionType)) return;
if (args[0].hitTargets.length < 1 || args[0].item.system.damage.parts[0][1] !== "piercing") return {};

const roll = args[0].damageRoll;
if (!roll.terms[0].faces) return;

const dieSize = roll.terms[0].faces;

if (args[0].tag === "DamageBonus" && args[0].isCritical) {
  return { damageRoll: `1d${dieSize}[piercing]`, flavor: "Critical Piercer Feat extra damage" };
}

const lowDice = Math.min(...roll.terms[0].values);

if (args[0].macroPass === "postDamageRoll" && lowDice !== dieSize) {
  let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
  let response = await Dialog.confirm({
    title: "Piercer feat",
    content: `<p>${args[0].actor.name} rolled a ${lowDice} on 1d${dieSize}. Reroll?</p>`,
  });
  if (!response) return;

  const damageRoll = new CONFIG.Dice.DamageRoll(`1d${dieSize}`);
  await damageRoll.toMessage({ flavor: `Piercer rerolled ${lowDice}...` });
  workflow.damageRoll.dice[0].results.find((i) => i.result === lowDice).result = damageRoll.total;

  Hooks.once("midi-qol.DamageRollComplete", async (workflow) => {
    let totalDamage = 0;
    let merged = workflow.damageDetail.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] ?? 0) + item.damage;
      return acc;
    }, {});

    const newDetail = Object.keys(merged).map((key) => { return { damage: Math.max(0, merged[key]), type: key } });
    totalDamage = newDetail.reduce((acc, value) => acc + value.damage, 0);
    workflow.damageDetail = newDetail;
    workflow.damageTotal = totalDamage;

    workflow.damageRoll._total = workflow.damageTotal;
    workflow.damageRollHTML = await workflow.damageRoll.render();

    await workflow.displayDamageRoll()
    return true;
  });

}

