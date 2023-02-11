if (this.targets.size != 1 || this.disadvantage) return;

const type = this.actor.type === "npc" ? this.actor.system.details?.type?.value : this.actor.system.details?.race;
if (type !== "undead") return;

const effect = this.actor.effects.find((eff) => eff.label === "Chill Touch");
if (!effect) return;

const sourceActor = await fromUuid(effect.origin);
if (this.targets.first().actor.id !== sourceActor.actor.id) return;

this.disadvantage = true;
