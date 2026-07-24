export default class ArcaneWard {

  actor: Actor.Implementation;

  wardDocument: Item.Implementation | undefined;

  static getEnricher({ actor }: { actor: Actor.Implementation }): ArcaneWard {
    const property = `DDBI.ENRICHERS.class.wizard.ArcaneWard.${actor.uuid}`;
    const ward = foundry.utils.getProperty(CONFIG, property) as ArcaneWard | undefined;
    if (ward) return ward;

    const enricher = new ArcaneWard({ actor });
    foundry.utils.setProperty(CONFIG, property, enricher);
    return enricher;
  }

  static wardDocumentName = "Arcane Ward";

  get wardStrength(): number {
    if (!this.wardDocument) return 0;
    return (foundry.utils.getProperty(this.wardDocument, "system.uses.value") as number) ?? 0;
  }

  get wardStrengthMax(): number {
    if (!this.wardDocument) return 0;
    return (foundry.utils.getProperty(this.wardDocument, "system.uses.max") as number) ?? 0;
  }

  async updateWardStrength(wardStrength: number) {
    if (!this.wardDocument) return undefined;
    // fvtt-types UpdateInput does not model flattened dotted update keys
    return this.wardDocument.update({ "system.uses.spent": this.wardStrengthMax - wardStrength } as unknown as Item.UpdateInput);
  }

  constructor({ actor }: { actor: Actor.Implementation }) {
    this.actor = actor;
    this.wardDocument = actor.items.find((i: Item.Implementation) => i.name === ArcaneWard.wardDocumentName);
  }

  async applyDamage(update: any) {
    const wardStrength = this.wardStrength;
    if (wardStrength === 0) return;

    const incomingHP = update.system.attributes.hp.value ?? 0;
    const oldHP = (foundry.utils.getProperty(this.actor, "system.attributes.hp.value") as number) ?? 0;
    const isHealing = incomingHP >= oldHP;
    // console.warn({
    //   incomingHP,
    //   oldHP,
    //   update,
    //   isHealing,
    // });

    if (isHealing) return;

    const damage = oldHP - incomingHP;
    const absorbed = Math.min(damage, wardStrength ?? 0);

    if (absorbed === 0) return;
    const newWardStrength = wardStrength - absorbed;
    const newHP = incomingHP + absorbed;
    const speaker = ChatMessage.getSpeaker({ actor: this.actor as any });
    const chatData = {
      content: `${ArcaneWard.wardDocumentName} absorbs ${absorbed} of ${damage} points of damage.<br> Hp -> ${newHP}<br>Ward strength -> ${newWardStrength}`,
      speaker,
    };
    // ChatMessage.applyRollMode(chatData, "gmroll");
    ChatMessage.create(chatData as unknown as ChatMessage.CreateInput);
    update.system.attributes.hp.value = newHP;
    await this.updateWardStrength(newWardStrength);
  }

  async addWard({ spellLevel }: { spellLevel: number }) {
    const wardStrength = this.wardStrength;
    const wardStrengthMax = this.wardStrengthMax;
    const newWardStrength = Math.min(wardStrength + (spellLevel * 2), wardStrengthMax);

    if (wardStrength === newWardStrength) return;
    const speaker = ChatMessage.getSpeaker({ actor: this.actor as any });
    const chatData = {
      content: `${ArcaneWard.wardDocumentName} gains ${spellLevel * 2} points to ${newWardStrength}/${wardStrengthMax}`,
      speaker,
    };
    // ChatMessage.applyRollMode(chatData, "gmroll");
    ChatMessage.create(chatData as unknown as ChatMessage.CreateInput);
    await this.updateWardStrength(newWardStrength);
  }

  static isAbjurer(actor: any) {
    return actor.classes?.wizard
      && actor.classes.wizard.subclass
      && ["Abjurer", "School of Abjuration"].includes(actor.classes.wizard.subclass.name);
  }

  static async preUpdateActorHook(subject: any, update: any, _options: any, _user: any) {
    if (!ArcaneWard.isAbjurer(subject)) return true;
    if (update.system?.attributes?.hp?.value !== undefined) {
      const arcaneWardEnhancer = ArcaneWard.getEnricher({ actor: subject });
      await arcaneWardEnhancer.applyDamage(update);
    }
    return true;
  }

  static async dnd5eActivityConsumptionHook(activity: any, usageConfig: any, messageConfig: any, _updates: any) {
    // only care about spells
    if (messageConfig.data?.flags?.dnd5e?.item?.type !== "spell") return true;
    // only spells that use spell slots
    if (!usageConfig.consume?.spellSlot) return true;
    const spellLevel = messageConfig.data?.flags?.dnd5e?.use?.spellLevel;
    if (spellLevel === undefined) return true;
    const spell = activity.parent;
    if (!spell) return true;
    if (spell.school !== "abj" || spell.level === 0) return true;
    // only abjurers have this
    const subject = activity.actor;
    if (!ArcaneWard.isAbjurer(subject)) return true;

    const arcaneWardEnhancer = ArcaneWard.getEnricher({ actor: subject });
    await arcaneWardEnhancer.addWard({ spellLevel });

    return true;
  }

}
