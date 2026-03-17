import DDBEffectHelper from "../../../effects/DDBEffectHelper";
import { logger } from "../../../lib/_module";
import DDBDescriptions, { IFeatureBasicsResult } from "../../lib/DDBDescriptions";
import AutoEffects from "./AutoEffects";
import ChangeHelper from "./ChangeHelper";

interface IGenerateDamageOverTimeEffectOptions {
  startTurn?: boolean;
  endTurn?: boolean;
  durationSeconds?: number;
  damage?: string;
  damageType?: string;
  saveAbility?: string | string[];
  saveRemove?: boolean;
  saveDamage?: string;
  dc?: number;
}

interface IMidiOverTimeEffectOptions {
  document: I5ePCItem | I5eMonsterItem;
  actor: I5eActorData;
  otherDescription?: string | null;
  flags?: Record<string, any>;
  addToMonster?: boolean;
}

export default class MidiOverTimeEffect {
  parsedDescription: IFeatureBasicsResult;
  document: I5ePCItem | I5eMonsterItem;
  actor: I5eActorData;
  effect: I5eEffectData;
  conditionStatus: ReturnType<typeof DDBDescriptions.parseStatusCondition>;
  conditionEffect: ReturnType<typeof AutoEffects.getStatusConditionEffect> | null;
  description: string;
  flags: Record<string, any>;
  addToMonster: boolean;

  constructor({ document, actor, otherDescription = null, flags = {}, addToMonster = true }: IMidiOverTimeEffectOptions) {
    this.document = document;
    this.actor = actor;
    this.effect = AutoEffects.MonsterFeatureEffect(document, `${document.name}`);
    this.description = otherDescription ?? document.system.description.value;
    this.conditionStatus = DDBDescriptions.parseStatusCondition({ text: this.description });
    this.conditionEffect = this.conditionStatus.success
      ? AutoEffects.getStatusConditionEffect({ status: this.conditionStatus, flags })
      : null;
    this.parsedDescription = DDBDescriptions.featureBasics({ text: this.description });
    this.flags = flags;
    this.addToMonster = addToMonster;
    // console.warn(`MidiOvertimeEffect for ${this.document.name} on ${this.actor.name}`, {
    //   this: this,
    //   conditionStatus: deepClone(this.conditionStatus),
    //   conditionEffect: deepClone(this.conditionEffect),
    //   parsedDescription: this.parsedDescription,
    //   effect: deepClone(this.effect),
    // });
  }

  static getOverTimeSaveEndChange({ document, save, text }) {
    const saveSearch = /repeat the saving throw at the (end|start) of each/;
    const match = text.match(saveSearch);
    if (match) {
      return ChangeHelper.overTimeSaveChange({ document, turn: match[1], saveAbility: save.ability, dc: save.dc });
    } else {
      const actionSaveSearch = /can use its action to repeat the saving throw/;
      const actionSaveMatch = text.match(actionSaveSearch);
      if (actionSaveMatch) {
        return ChangeHelper.overTimeSaveChange({ document, turn: "action", saveAbility: save.ability, dc: save.dc });
      }
    }
    return null;
  }

  effectCleanup() {
    if (!this.addToMonster) return;
    if (this.effect.changes.length > 0 || this.effect.statuses.length > 0) {
      this.document.effects.push(this.effect);
      const overTimeFlags: string[] = foundry.utils.hasProperty(this.actor, "flags.monsterMunch.overTime")
        ? foundry.utils.getProperty(this.actor, "flags.monsterMunch.overTime") as string[]
        : [];
      overTimeFlags.push(this.document.name);
      foundry.utils.setProperty(this.actor, "flags.monsterMunch.overTime", overTimeFlags);
      // console.warn(`ITEM OVER TIME EFFECT: ${actor.name}, ${document.name}`);
      if (foundry.utils.getProperty(this.document, "system.duration.units") === "inst") {
        foundry.utils.setProperty(this.document, "system.duration", {
          units: "round",
          value: this.effect.duration.rounds,
        });
      }
      logger.debug(`Cleanup of over time effect for ${this.actor.name}, ${this.actor.name} for ${this.document.name}`, this.effect);
    }
  }

  generateOverTimeEffect() {
    logger.debug(`Checking for over time effects for ${this.document.name} on ${this.actor.name}`);
    if (!this.document.effects) this.document.effects = [];
    // add any condition effects
    if (this.conditionEffect) {
      this.effect.changes.push(...this.conditionEffect.changes);
      this.effect.statuses.push(...this.conditionEffect.statuses);
      if (this.conditionEffect.name) this.effect.name = this.conditionEffect.name;
      this.effect.flags = foundry.utils.mergeObject(this.effect.flags, this.conditionEffect.flags);
      foundry.utils.setProperty(this.document, "flags.midiProperties.fulldam", true);
      const change = MidiOverTimeEffect.getOverTimeSaveEndChange({ document: this.document, save: this.conditionStatus.save, text: this.description });
      if (change) this.effect.changes.push(change);
    }

    const duration = this.conditionStatus.duration ?? DDBDescriptions.getDuration(this.description);
    if (duration.seconds) foundry.utils.setProperty(this.effect, "duration.seconds", duration.seconds);
    if (duration.rounds) foundry.utils.setProperty(this.effect, "duration.rounds", duration.rounds);

    const turn = DDBDescriptions.startOrEnd(this.description);
    if (!turn) {
      logger.debug(`No turn over time effect for ${this.document.name} on ${this.actor.name}`);
      this.effectCleanup();
      return;
    }

    const save = this.parsedDescription.save;
    if (!Number.isInteger(Number.parseInt(String(save.dc)))) {
      this.effectCleanup();
      return;
    }

    const saveAbility = save.ability;
    const dc = save.dc;

    const dmg = DDBEffectHelper.getOvertimeDamage(this.description, this.document);
    if (!dmg) {
      logger.debug(`Adding non damage Overtime effect for ${this.document.name} on ${this.actor.name}`);
      this.effectCleanup();
      return;
    }

    const dmgParts = dmg.map((dp) => dp.damageString);

    // overtime damage, revert any full damage flag, reset to default on save
    foundry.utils.setProperty(this.document, "flags.midiProperties.fulldam", false);

    const damage: string = foundry.utils.getProperty(this.document.flags, "monsterMunch.overTime.damage") as string
      ?? foundry.utils.getProperty(this.document.flags, "ddbimporter.overTime.damage") as string
      ?? dmgParts.reduce((total, current) => {
        total = [total, `${current[0]}[${current[1]}]`].join(" + ");
        return total;
      }, "") as string;

    const damageType: string = foundry.utils.getProperty(this.document.flags, "monsterMunch.overTime.damageType") as string
      ?? foundry.utils.getProperty(this.document.flags, "ddbimporter.overTime.damageType") as string
      ?? (dmgParts.length > 0
        ? dmg[0].damageTypes[0]
        : "");

    const saveRemove: boolean = foundry.utils.getProperty(this.document.flags, "monsterMunch.overTime.saveRemove") as boolean
      ?? foundry.utils.getProperty(this.document.flags, "ddbimporter.overTime.saveRemove") as boolean
      ?? true;

    const saveDamage: string = foundry.utils.getProperty(this.document.flags, "monsterMunch.overTime.saveDamage") as string
      ?? foundry.utils.getProperty(this.document.flags, "ddbimporter.overTime.saveDamage") as string
      ?? "nodamage";

    logger.debug(`generateOverTimeEffect: Generated over time effect for ${this.actor.name}, ${this.document.name}`);
    this.effect.changes.push(ChangeHelper.overTimeDamageChange({
      document: this.document,
      turn,
      damage,
      damageType,
      saveAbility,
      saveRemove,
      saveDamage,
      dc,
    }));

    this.effectCleanup();
  }

  generateConditionOnlyEffect() {
    logger.debug(`Checking for condition effects for ${this.document.name} on ${this.actor.name}`);
    if (!this.document.effects) this.document.effects = [];
    this.effect._id = foundry.utils.randomID();
    // add any condition effects
    if (!this.conditionEffect) {
      return;
    }
    this.effect.changes.push(...this.conditionEffect.changes);
    this.effect.statuses.push(...this.conditionEffect.statuses);
    if (this.conditionEffect.name && this.conditionEffect.name !== "") this.effect.name = this.conditionEffect.name;
    this.effect.flags = foundry.utils.mergeObject(this.effect.flags, this.conditionEffect.flags);

    const duration = this.conditionEffect.duration;
    if (duration.seconds) foundry.utils.setProperty(this.effect, "duration.seconds", duration.seconds);
    if (duration.rounds) foundry.utils.setProperty(this.effect, "duration.rounds", duration.rounds);

    // Object.keys(this.document.system.activities).forEach((id) => {
    //   this.document.system.activities[id].effects.push(
    //     {
    //       "_id": this.effect._id,
    //       "onSave": false,
    //     },
    //   );
    // });

    this.effectCleanup();

  }

  generateDamageOverTimeEffect({ startTurn = false, endTurn = false, durationSeconds, damage,
    damageType, saveAbility, saveRemove = true, saveDamage = "nodamage", dc }: IGenerateDamageOverTimeEffectOptions,
  ) {
    if (!startTurn && !endTurn) return;

    if (startTurn) {
      logger.debug(`damageOverTimeEffect: Generating damage over time effect START for ${this.document.name}`);
      this.effect.changes.push(
        ChangeHelper.overTimeDamageChange({ document: this.document, turn: "start", damage, damageType, saveAbility, saveRemove, saveDamage, dc }),
      );
    }
    if (endTurn) {
      logger.debug(`damageOverTimeEffect: Generating damage over time effect END for ${this.document.name}`);
      this.effect.changes.push(
        ChangeHelper.overTimeDamageChange({ document: this.document, turn: "end", damage, damageType, saveAbility, saveRemove, saveDamage, dc }),
      );
    }

    foundry.utils.setProperty(this.effect, "duration.seconds", durationSeconds);

    this.document.effects.push(this.effect);
  }

}
