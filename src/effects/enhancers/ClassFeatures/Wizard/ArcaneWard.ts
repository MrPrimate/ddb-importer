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

  /**
   * Reduces an incoming HP update by the ward strength. dnd5e has already taken the damage from
   * temp HP before hit points by the time this sees the update, but the ward absorbs damage before
   * either, so the absorbed points are refunded to hit points first and then to temp HP.
   */
  async applyDamage(update) {
    const wardStrength = this.wardStrength;
    if (wardStrength === 0) return;

    const hpUpdate = update.system.attributes.hp;
    const oldHP = this.actor.system.attributes.hp.value ?? 0;
    const oldTemp = Number(this.actor.system.attributes.hp.temp) || 0;
    const incomingHP = hpUpdate.value ?? oldHP;
    const incomingTemp = hpUpdate.temp === undefined ? oldTemp : (Number(hpUpdate.temp) || 0);

    const hpLoss = Math.max(0, oldHP - incomingHP);
    const tempLoss = Math.max(0, oldTemp - incomingTemp);
    const damage = hpLoss + tempLoss;
    if (damage === 0) return;

    const absorbed = Math.min(damage, wardStrength);
    const hpRefund = Math.min(absorbed, hpLoss);
    const tempRefund = absorbed - hpRefund;
    const newWardStrength = wardStrength - absorbed;
    const newHP = incomingHP + hpRefund;
    const newTemp = incomingTemp + tempRefund;

    const tempText = tempRefund > 0 || tempLoss > 0 ? `<br>Temp HP -> ${newTemp}` : "";
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const chatData = {
      content: `${ArcaneWard.wardDocumentName} absorbs ${absorbed} of ${damage} points of damage.<br> Hp -> ${newHP}${tempText}<br>Ward strength -> ${newWardStrength}`,
      speaker,
    };
    // ChatMessage.applyRollMode(chatData, "gmroll");
    ChatMessage.create(chatData);
    // the update must be changed before the first await, Foundry does not wait for async hooks
    if (hpUpdate.value !== undefined) hpUpdate.value = newHP;
    if (tempRefund > 0) hpUpdate.temp = newTemp;
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

  static async preUpdateActorHook(subject, update, options, _user) {
    if (!ArcaneWard.isAbjurer(subject)) return true;
    // a rest clears temp HP; that is not damage for the ward to absorb
    if (options?.isRest) return true;
    const hpUpdate = update.system?.attributes?.hp;
    if (hpUpdate?.value !== undefined || hpUpdate?.temp !== undefined) {
      const arcaneWardEnhancer = ArcaneWard.getEnricher({ actor: subject });
      await arcaneWardEnhancer.applyDamage(update);
    }
    return true;
  }

  /**
   * The slot level a spell use spends. dnd5e 5.2 flags it on the usage message, 5.3 stores it on the
   * message system data, and 6.0 records neither, so fall back to the level of the chosen slot.
   */
  static spellLevelFromUse(activity, usageConfig, messageConfig): number | undefined {
    const recorded = messageConfig.data?.system?.spellLevel ?? messageConfig.data?.flags?.dnd5e?.use?.spellLevel;
    if (Number.isFinite(recorded)) return recorded;
    const slot = usageConfig.spell?.slot;
    const level = slot ? activity.actor?.system?.spells?.[slot]?.level : undefined;
    return Number.isFinite(level) ? level : undefined;
  }

  static async dnd5eActivityConsumptionHook(activity, usageConfig, messageConfig, _updates) {
    // only care about spells
    if (messageConfig.data?.flags?.dnd5e?.item?.type !== "spell") return true;
    // only spells that use spell slots
    if (!usageConfig.consume?.spellSlot) return true;
    const spellLevel = ArcaneWard.spellLevelFromUse(activity, usageConfig, messageConfig);
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
