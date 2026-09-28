import _MonsterFeatureSupport from "./_MonsterFeatureSupport";
import Teleport from "./Teleport";
import {
  choiceLabel,
  hasStrengthAdvantage,
  parseBenefitRiders,
  parseResistanceDuration,
  parseSelfResistance,
  resistanceChanges,
} from "./_ResistanceText";

const SPIKES_ID = "ddbSelfResDmg001";
const TELEPORT_ID = "ddbSelfResTele01";

/**
 * Monster features in which the monster grants itself damage resistance or immunity: Zaratan's
 * Retract, Lunar Dragon Phase, rages and frenzies, defensive reactions, and resistances picked on
 * use (Chromatic Resistance, Apothecary, "the triggering damage"). Routed through
 * GENERIC_FEATURE_NAME, and text-gated so a shared name ("Enlarge", "Rage") whose wording grants
 * no resistance keeps the parser's default activity.
 *
 * The activity is a self enchantment: the enchantment marks the feature "(Active)" and brings in
 * a rider effect that carries the resistance to the actor, so a counted duration ends the benefit
 * by expiring the enchantment. With no duration the activity is renamed "Deactivate" while active,
 * as using a self enchantment again removes it. A resistance picked on use gets one enchantment
 * and rider per option, which dnd5e offers as a choice when the activity is used.
 *
 * The rider also carries any status the same sentence puts on the monster ("and it is
 * restrained"), the rage wording's advantage on Strength checks and saves, and the other benefits
 * parseBenefitRiders reads (weapon damage bonuses, size, attack advantage, condition immunity,
 * fly speed, doubled speeds). Attacks against the monster at advantage or disadvantage need AC5e
 * or midi. Healing in the text (Dohma Rally) stays the parser's own heal activity beside the
 * enchantment, a self-teleport in the same action becomes a Teleport activity, and damage dealt
 * to others while active (Panic Shift's spikes) becomes an activity that is only offered while
 * the enchantment is on.
 */
export default class SelfResistance extends _MonsterFeatureSupport {

  get grant(): ReturnType<typeof parseSelfResistance> {
    return parseSelfResistance(this.text);
  }

  /** Some stat blocks only mark concentration in the feature name ("Shadow Form (1/Day; Concentration)"). */
  get duration(): ReturnType<typeof parseResistanceDuration> {
    return parseResistanceDuration(`${this.name}. ${this.text}`);
  }

  get isOpenEnded(): boolean {
    const duration = this.duration;
    return duration.seconds === null && duration.expiry === null && !duration.concentration;
  }

  get spikeParts(): I5eDamagePart[] {
    return this.damageTokens(this.text).map((token) => token.part);
  }

  override get type(): IDDBActivityType | null {
    return this.grant ? _MonsterFeatureSupport.ACTIVITY_TYPES.ENCHANT : null;
  }

  /** The activity duration, which dnd5e 6.0 also stamps onto an applied effect with no expiry. */
  get activityDuration(): Partial<I5eActivityDuration> | null {
    const duration = this.duration;
    if (duration.seconds) {
      const minutes = duration.seconds % 3600 === 0 ? null : duration.seconds / 60;
      return {
        override: true,
        value: String(minutes ?? duration.seconds / 3600),
        units: minutes ? "minute" : "hour",
        concentration: duration.concentration,
      };
    }
    if (duration.concentration) return { override: true, value: "", units: "spec", concentration: true };
    return null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.type) return null;
    const duration = this.activityDuration;
    return {
      targetSelf: true,
      rangeSelf: true,
      noTemplate: true,
      removeDamageParts: true,
      ...((/^At the start of each of/i).test(this.text) ? { activationType: "turnStart" as const } : {}),
      data: {
        enchant: { self: true },
        ...(duration ? { duration: duration as I5eActivityDuration } : {}),
      },
    };
  }

  /** A self-teleport in the same action ("teleports up to 30 feet ... and gains resistance to all damage"). */
  get teleportDistance(): string | null {
    return Teleport.selfTeleportDistance(this.text);
  }

  /** The monster's size key, for a benefit that grows it one size. */
  get monsterSize(): string | null {
    return (this.parser.ddbMonster?.npc?.system?.traits?.size as string | undefined) ?? null;
  }

  get benefitRiders(): ReturnType<typeof parseBenefitRiders> {
    return parseBenefitRiders(this.text, { size: this.monsterSize });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.type) return [];
    const activities: IDDBAdditionalActivity[] = [];
    const distance = this.teleportDistance;
    if (distance) {
      activities.push(this.extra("Teleport", TELEPORT_ID, "teleport", {
        rangeOverride: { override: true, value: distance, units: "ft", special: "" },
        targetOverride: { prompt: false, affects: { count: "1", type: "self" }, template: {} } as I5eActivityTarget,
        activationOverride: { type: "special", value: null, condition: `Part of ${this.key}` },
      }));
    }
    const spikeParts = this.spikeParts;
    if (spikeParts.length === 0) return activities;
    return [
      ...activities,
      this.extra("Damage", SPIKES_ID, "damage", {
        generateDamage: true,
        damageParts: spikeParts,
        activationOverride: {
          type: "special",
          value: null,
          condition: "When a creature triggers the damage described in the feature",
        },
      }),
    ];
  }

  /** Item changes made by the enchantment while the feature is active. */
  get enchantmentChanges(): IActiveEffectChangeData[] {
    const C = _MonsterFeatureSupport.ChangeHelper;
    const changes = [
      C.overrideChange("{} (Active)", 10, "name"),
      // using a self enchantment again removes it, which should cost nothing; zeroConsumptionClears
      // turns this into per-target changes that survive a compendium import
      C.overrideChange("[]", 10, "activities[enchant].consumption.targets"),
    ];
    if (this.isOpenEnded) {
      changes.push(
        C.overrideChange("Deactivate", 10, "activities[enchant].name"),
        C.overrideChange("special", 10, "activities[enchant].activation.type"),
        C.overrideChange("When the feature ends", 10, "activities[enchant].activation.condition"),
      );
    }
    return changes;
  }

  override get effects(): IDDBEffectHint[] {
    const grant = this.grant;
    if (!grant) return [];
    const duration = this.duration;
    const C = _MonsterFeatureSupport.ChangeHelper;

    const benefits = this.benefitRiders;
    const extraChanges = hasStrengthAdvantage(this.text)
      ? [C.abilityCheckRollModeChange("str", C.ADVANTAGE), C.abilitySaveRollModeChange("str", C.ADVANTAGE)]
      : [];
    const options = grant.choice ? grant.types.map((type) => [type]) : [grant.types];
    const description = this.isOpenEnded
      ? `${grant.sentence} Use Deactivate when the feature ends.`
      : grant.sentence;

    return options.flatMap((types, index) => {
      const suffix = String(index + 1).padStart(3, "0");
      const riderId = `ddbSelfResRdr${suffix}`;
      const label = grant.choice ? `${this.key}: ${choiceLabel(grant, types[0])}` : this.key;
      return [
        {
          name: label,
          changes: [...resistanceChanges(grant, C, types), ...extraChanges, ...benefits.changes],
          ac5eChanges: benefits.ac5eChanges,
          midiChanges: benefits.midiChanges,
          statuses: grant.statuses,
          // a rider on the feature stays inert until the enchantment copies it onto the item
          options: { transfer: true, durationSeconds: null, expiry: null, description },
          data: { _id: riderId },
        },
        {
          name: label,
          type: "enchant",
          activityTypesMatch: ["enchant"],
          changes: this.enchantmentChanges,
          options: {
            durationSeconds: duration.seconds,
            ...(duration.expiry ? { expiry: duration.expiry } : {}),
            description,
          },
          data: {
            _id: `ddbSelfResEnc${suffix}`,
            flags: {
              ddbimporter: {
                effectRiders: [riderId],
                activityRiders: this.spikeParts.length > 0 ? [SPIKES_ID] : [],
              },
            },
          },
        },
      ];
    });
  }

  // the parser's own status effects would link to the enchantment
  override get clearAutoEffects(): boolean {
    return this.grant !== null;
  }

}
