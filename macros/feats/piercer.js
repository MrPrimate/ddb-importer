if (!["mwak", "rwak", "msak", "rsak"].includes(args[0].item.system.actionType)) return
if (args[0].hitTargets.length < 1 || args[0].item.system.damage.parts[0][1] !== "piercing") return {};

const roll = args[0].damageRoll;
if (!roll.terms[0].faces) return;

const dieSize = roll.terms[0].faces;
const isCrit = args[0].isCritical;

if (args[0].tag === "DamageBonus" && args[0].item.system.damage.parts[0][1] === "piercing") {
  if (isCrit) return { damageRoll: `1d${dieSize}[piercing]`, flavor: "Critical Piercer Feat extra damage" };
}

const lowDice = Math.min(...roll.terms[0].values);

if (args[0].macroPass === "postDamageRoll" && lowDice !== dieSize) {
  console.warn(args[0].uuid)
  let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
  let response = await Dialog.confirm({
    title: "Piercer feat",
    content: `<p>${token.name} rolled a ${lowDice} on 1d${dieSize}. Reroll?</p>`,
  });
  if (!response) return;
  const damageRoll = new Roll(`1d${dieSize}`);
  await damageRoll.toMessage({ flavor: `Piercer rerolled ${lowDice}..` });
  workflow.damageRoll.dice[0].results.find((i) => i.result === lowDice).result = damageRoll.total;
}
