const lastArg = args[0];
if (workflow.targets.size != 1 || workflow.disadvantage) return;

const type = DDBImporter?.EffectHelper.getTypeOrRace(workflow.actor);
if (type !== "undead") return;

const effect = workflow.actor.effects.find((eff) => (eff.name ?? eff.label) === "Chill Touch");
if (!effect) return;


const sourceActor = await fromUuid(effect.origin);
if (workflow.targets.first().actor.id !== sourceActor.actor.id) return;

workflow.disadvantage = true;
