if (this.targets.size != 1 || this.disadvantage) return;

const type = DDBImporter?.EffectHelper.getTypeOrRace(this.actor);
if (type !== "undead") return;

const effect = this.actor.effects.find((eff) => (eff.name ?? eff.label) === "Chill Touch");
if (!effect) return;

const sourceActor = await fromUuid(effect.origin);
if (this.targets.first().actor.id !== sourceActor.actor.id) return;

this.disadvantage = true;
