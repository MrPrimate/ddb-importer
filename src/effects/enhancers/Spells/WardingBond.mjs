export default class WardingBond {

  static async applyCasterAtZeroHP({
    targetUuid, actor, itemUuid,
  } = {}) {
    const targetActor = await fromUuid(targetUuid);
    const effectsToDelete = actor.effects.filter((e) => e.origin === itemUuid).map((t) => t.uuid)
      .concat(targetActor.effects.filter((e) => e.origin === itemUuid).map((t) => t.uuid));
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

  // eslint-disable-next-line complexity
  static async preUpdateActorHook(subject, update, options, _user) {
    console.warn("preUpdateActor", { subject, update, hpInUpdate: !(update.system?.attributes?.hp ?? false), options, _user });
    if (!(update.system?.attributes?.hp ?? false)) return true;
    const targetFlag = DDBImporter.EffectHelper.getFlag(subject, "WardingBondIds");
    const casterFlag = DDBImporter.EffectHelper.getFlag(subject, "WardingBondTargets");

    console.warn({ targetFlag, casterFlag });
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

    console.warn({ oldHP, newHP, hpChange, bool: casterFlag && subject.id === casterFlag.casterID && newHP <= 0 });

    // damage applied to caster, evaluate if warding bond remains in effect
    if (casterFlag && subject.id === casterFlag.casterID && newHP <= 0) {
      await WardingBond.applyCasterAtZeroHP({
        targetUuid: casterFlag.targetUuid,
        actor: subject,
        itemUuid: casterFlag.itemUuid,
      });

      return true;
    }

    // damage applied to target, roll against caster
    if (targetFlag && Number.isInteger(hpChange) && hpChange > 0) {
      await WardingBond.applyDamageToTarget({
        damage: hpChange,
        actor: subject,
        casterUuid: targetFlag.casterUuid,
      });
    }
    return true;
  }

}
