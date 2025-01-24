import DDBEffectHelper from "../../DDBEffectHelper.mjs";

export default class WardingBond {

  static async applyCasterAtZeroHP({
    targetUuid, actor, originUuid,
  } = {}) {
    const targetActor = await fromUuid(targetUuid);
    const effectsToDelete = actor.effects.filter((e) => e.origin === originUuid).map((t) => t.uuid)
      .concat(targetActor.effects.filter((e) => e.origin === originUuid).map((t) => t.uuid));

    await globalThis.DDBImporter.socket.executeAsGM("deleteEffectsByUuid", {
      effectsToDelete,
    });
  }

  static async applyDamageToTarget({
    damage, actor, casterUuid,
  } = {}) {
    const caster = await fromUuid(casterUuid);
    await caster.applyDamage(damage);
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: caster }),
      content: `${caster.name} took ${damage} damage from Warding Bond with ${actor.name}`,
    });
  }

  static async checkEffects({ targetActor, casterActor, originUuid } = {}) {
    const targetEffect = targetActor.effects.find((e) => e.origin === originUuid);
    const casterEffect = casterActor.effects.find((e) => e.origin === originUuid);

    if (targetEffect && casterEffect) return true;

    if (targetEffect) {
      await globalThis.DDBImporter.socket.executeAsGM("deleteEffectsByUuid", {
        effectsToDelete: [targetEffect.uuid],
      });
    }

    if (casterEffect) {
      await globalThis.DDBImporter.socket.executeAsGM("deleteEffectsByUuid", {
        effectsToDelete: [casterEffect.uuid],
      });
    }

    await DDBEffectHelper.unsetFlag(targetActor, "WardingBondIds");
    await DDBEffectHelper.unsetFlag(casterActor, "WardingBondTargets");
    return false;
  }

  // eslint-disable-next-line complexity
  static async preUpdateActorHook(subject, update, options, _user) {
    if (!(update.system?.attributes?.hp ?? false)) return true;
    const targetFlag = DDBEffectHelper.getFlag(subject, "WardingBondIds");
    const casterFlag = DDBEffectHelper.getFlag(subject, "WardingBondTargets");

    if (!targetFlag && !casterFlag) return true;
    if (targetFlag && targetFlag.targetID !== subject.id) {
      if (!casterFlag || casterFlag.casterID !== subject.id) return true;
    }
    if (casterFlag && casterFlag.casterID !== subject.id) {
      if (!targetFlag) return true;
    }

    const oldHP = options.dnd5e.hp.value ?? 0 + options.dnd5e.hp.temp ?? 0;
    const newHP = foundry.utils.getProperty(update, "system.attributes.hp.value") ?? 0
      + foundry.utils.getProperty(update, "system.attributes.hp.temp") ?? 0;
    const hpChange = oldHP - newHP;

    // damage applied to caster, evaluate if warding bond remains in effect
    if (casterFlag && subject.id === casterFlag.casterID && newHP <= 0) {
      const targetActor = await fromUuid(casterFlag.targetUuid);
      const matchingEffects = this.checkEffects({ targetActor, casterActor: subject, originUuid: casterFlag.originUuid });
      if (!matchingEffects) return true;
      await WardingBond.applyCasterAtZeroHP({
        targetUuid: casterFlag.targetUuid,
        actor: subject,
        originUuid: casterFlag.originUuid,
      });

      return true;
    }

    // damage applied to target, roll against caster
    if (targetFlag && Number.isInteger(hpChange) && hpChange > 0) {
      const casterActor = await fromUuid(targetFlag.casterUuid);
      const matchingEffects = this.checkEffects({ targetActor: subject, casterActor, originUuid: targetFlag.originUuid });
      if (!matchingEffects) return true;
      await WardingBond.applyDamageToTarget({
        damage: hpChange,
        actor: subject,
        casterUuid: targetFlag.casterUuid,
      });
    }
    return true;
  }

}
