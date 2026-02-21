export default class ArcaneWard {

  static getEnricher({ actor } = {}) {
    const property = `DDBI.ENRICHERS.class.wizard.ArcaneWard.${actor.uuid}`;
    const ward = foundry.utils.getProperty(CONFIG, property);
    if (ward) return ward;

    const enricher = new ArcaneWard({ actor });
    foundry.utils.setProperty(CONFIG, property, enricher);
    return enricher;
  }

  static wardDocumentName = "Arcane Ward";

  get wardStrength() {
    return this.wardDocument.system?.uses.value ?? 0;
  }

  get wardStrengthMax() {
    return this.wardDocument.system?.uses.max ?? 0;
  }

  async updateWardStrength(wardStrength) {
    return this.wardDocument.update({ "system.uses.spent": this.wardStrengthMax - wardStrength });
  }

  constructor({ actor } = {}) {
    this.actor = actor;
    this.wardDocument = actor.items.find((i) => i.name === ArcaneWard.wardDocumentName);
  }

  async applyDamage(update) {
    const wardStrength = this.wardStrength;
    if (wardStrength === 0) return;

    const incomingHP = update.system.attributes.hp.value ?? 0;
    const oldHP = this.actor.system.attributes.hp.value ?? 0;
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
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const chatData = {
      content: `${ArcaneWard.wardDocumentName} absorbs ${absorbed} of ${damage} points of damage.<br> Hp -> ${newHP}<br>Ward strength -> ${newWardStrength}`,
      speaker,
    };
    // ChatMessage.applyRollMode(chatData, "gmroll");
    ChatMessage.create(chatData);
    update.system.attributes.hp.value = newHP;
    await this.updateWardStrength(newWardStrength);
  }

  async addWard({ spellLevel } = {}) {
    const wardStrength = this.wardStrength;
    const wardStrengthMax = this.wardStrengthMax;
    const newWardStrength = Math.min(wardStrength + (spellLevel * 2), wardStrengthMax);

    if (wardStrength === newWardStrength) return;
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const chatData = {
      content: `${ArcaneWard.wardDocumentName} gains ${spellLevel * 2} points to ${newWardStrength}/${wardStrengthMax}`,
      speaker,
    };
    // ChatMessage.applyRollMode(chatData, "gmroll");
    ChatMessage.create(chatData);
    await this.updateWardStrength(newWardStrength);
  }

  static isAbjurer(actor) {
    return actor.classes?.wizard
      && actor.classes.wizard.subclass
      && ["Abjurer", "School of Abjuration"].includes(actor.classes.wizard.subclass.name);
  }

  static async preUpdateActorHook(subject, update, _options, _user) {
    if (!ArcaneWard.isAbjurer(subject)) return true;
    if (update.system?.attributes?.hp?.value !== undefined) {
      const arcaneWardEnhancer = ArcaneWard.getEnricher({ actor: subject });
      await arcaneWardEnhancer.applyDamage(update);
    }
    return true;
  }

  static async dnd5eActivityConsumptionHook(activity, usageConfig, messageConfig, _updates) {
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
