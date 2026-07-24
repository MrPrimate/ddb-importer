import DDBEffectHelper from "../../DDBEffectHelper";
import { logger } from "../../../lib/_module";

interface IWardingBondTargetFlag {
  targetID?: string;
  casterUuid?: string;
  originUuid?: string;
}

interface IWardingBondCasterFlag {
  casterID?: string;
  targetUuid?: string;
  originUuid?: string;
}

export default class WardingBond {

  static async applyCasterAtZeroHP({
    targetUuid, actor, originUuid,
  }: { targetUuid: string; actor: Actor.Implementation; originUuid: string }) {
    const targetActor = await fromUuid(targetUuid) as unknown as Actor.Implementation;
    const effectsToDelete = actor.effects
      .filter((e: ActiveEffect.Implementation) => e.origin === originUuid)
      .map((t: ActiveEffect.Implementation) => t.uuid)
      .concat(targetActor.effects
        .filter((e: ActiveEffect.Implementation) => e.origin === originUuid)
        .map((t: ActiveEffect.Implementation) => t.uuid));

    await globalThis.DDBImporter.socket.executeAsGM("deleteEffectsByUuid", {
      effectsToDelete,
    });
  }

  static async applyDamageToTarget({
    damage, actor, casterUuid,
  }: { damage: number; actor: Actor.Implementation; casterUuid: string }) {
    const caster = await fromUuid(casterUuid) as unknown as Actor.Implementation;
    await caster.applyDamage(damage);
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: caster as any }),
      content: `${caster.name} took ${damage} damage from Warding Bond with ${actor.name}`,
    } as unknown as ChatMessage.CreateInput);
  }

  static async checkEffects({ targetActor, casterActor, originUuid }: {
    targetActor: Actor.Implementation;
    casterActor: Actor.Implementation;
    originUuid?: string;
  }) {
    const targetEffect = targetActor.effects.find((e: ActiveEffect.Implementation) => e.origin === originUuid);
    const casterEffect = casterActor.effects.find((e: ActiveEffect.Implementation) => e.origin === originUuid);

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


  static async preUpdateActorHook(subject: any, update: any, options: Record<string, any>, _user: any) {
    if (!(update.system?.attributes?.hp ?? false)) return true;
    const targetFlag = DDBEffectHelper.getFlag(subject, "WardingBondIds") as IWardingBondTargetFlag | null;
    const casterFlag = DDBEffectHelper.getFlag(subject, "WardingBondTargets") as IWardingBondCasterFlag | null;

    if (!targetFlag && !casterFlag) return true;
    if (targetFlag && targetFlag.targetID !== subject.id) {
      if (!casterFlag || casterFlag.casterID !== subject.id) return true;
    }
    if (casterFlag && casterFlag.casterID !== subject.id) {
      if (!targetFlag) return true;
    }

    const oldHP = (options.dnd5e.hp.value ?? 0) + (options.dnd5e.hp.temp ?? 0);
    const newHP = ((foundry.utils.getProperty(update, "system.attributes.hp.value") as number) ?? 0)
      + ((foundry.utils.getProperty(update, "system.attributes.hp.temp") as number) ?? 0);
    const hpChange = oldHP - newHP;

    // damage applied to caster, evaluate if warding bond remains in effect
    if (casterFlag && subject.id === casterFlag.casterID && newHP <= 0) {
      if (!casterFlag.targetUuid || !casterFlag.originUuid) {
        logger.warn("Warding Bond caster flag is missing target or origin uuid", { casterFlag });
        return true;
      }
      const targetActor = await fromUuid(casterFlag.targetUuid) as Actor.Implementation;
      const matchingEffects = await this.checkEffects({ targetActor, casterActor: subject, originUuid: casterFlag.originUuid });
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
      if (!targetFlag.casterUuid) {
        logger.warn("Warding Bond target flag is missing caster uuid", { targetFlag });
        return true;
      }
      const casterActor = await fromUuid(targetFlag.casterUuid) as Actor.Implementation;
      const matchingEffects = await this.checkEffects({ targetActor: subject, casterActor, originUuid: targetFlag.originUuid });
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
