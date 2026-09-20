import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Form of the Beast: a 10-minute transformation that lasts 1 hour from warlock level 6. The span
 * lives on a feature scale value so the activity duration follows the character's level without
 * a reimport. dnd5e resolves a feature-held scale against the feature's advancement root, so
 * the override points that at the Warlock item. DDB also ships the same numbers as a level scale
 * on the subclass, but its key depends on that subclass's identifier.
 */
export default class FormOfTheBeast extends DDBEnricherData {

  static SCALE = "@scale.form-of-the-beast.duration";

  static MINUTES = { 1: 10, 6: 60 };

  /** Warlock level on the character being imported, or null when munching without one. */
  get warlockLevel(): number | null {
    const classes = this.ddbParser?.ddbData?.character?.classes ?? [];
    return classes.find((klass) => klass.definition?.name === "Warlock")?.level ?? null;
  }

  /** Minutes the transformation lasts at the imported warlock level, from the MINUTES breakpoints. */
  get effectMinutes(): number {
    const level = this.warlockLevel ?? 1;
    const reached = Object.keys(FormOfTheBeast.MINUTES)
      .map(Number)
      .filter((breakpoint) => breakpoint <= level);
    const breakpoint = reached.length > 0 ? Math.max(...reached) : 1;
    return FormOfTheBeast.MINUTES[breakpoint as keyof typeof FormOfTheBeast.MINUTES];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Transform",
      activationType: "bonus",
      targetType: "self",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          bonus: "min(20, @classes.warlock.levels*2)",
          types: ["temphp"],
        }),
        duration: {
          value: FormOfTheBeast.SCALE,
          units: "minute",
        },
      },
    };
  }

  override get additionalAdvancements(): I5eAdvancement[] {
    return [
      DDBEnricherData.AdvancementBuilder.buildNumberScale({
        name: "Form of the Beast Duration",
        identifier: "duration",
        hint: "How long the transformation lasts, in minutes.",
        scale: FormOfTheBeast.MINUTES,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const changes = [
      DDBEnricherData.ChangeHelper.advantageSkillChange("prc"),
      DDBEnricherData.ChangeHelper.advantageSkillChange("ste"),
      DDBEnricherData.ChangeHelper.advantageSkillChange("sur"),
    ];
    return [
      {
        // dnd5e 5.x does not copy the activity duration onto an applied effect, and the
        // description parser's first match is the level 6 "1 hour", so the span is fixed from the
        // warlock level at import (the munched copy takes the base ten minutes)
        name: "Form of the Beast",
        activityMatch: "Transform",
        options: {
          durationSeconds: this.effectMinutes * 60,
          expiry: null,
        },
        changes,
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Bite",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateTarget: true,
          generateRange: true,
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateDuration: true,
          durationOverride: {
            units: "inst",
          },
          activationOverride: {
            type: "action",
          },
        },
        overrides: {
          targetType: "creature",
          noConsumeTargets: true,
          data: {
            attack: {
              ability: "",
              bonus: "max(@abilities.str.mod, @abilities.cha.mod)",
              type: {
                value: "ranged",
              },
            },
            range: {
              value: "5",
              units: "ft",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 6,
                  bonus: "max(@abilities.str.mod, @abilities.cha.mod)",
                  type: "piercing",
                }),
              ],
            },
          },
        },
      },
      {
        init: {
          name: "Claw",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateTarget: true,
          generateRange: true,
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateDuration: true,
          durationOverride: {
            units: "inst",
          },
          activationOverride: {
            type: "bonus",
          },
        },
        overrides: {
          targetType: "creature",
          noConsumeTargets: true,
          data: {
            attack: {
              ability: "",
              bonus: "max(@abilities.str.mod, @abilities.cha.mod)",
              type: {
                value: "ranged",
              },
            },
            range: {
              value: "5",
              units: "ft",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 4,
                  bonus: "max(@abilities.str.mod, @abilities.cha.mod)",
                  type: "slashing",
                }),
              ],
            },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    // without an advancement root dnd5e reads a feature-held scale against character level,
    // which overshoots on a multiclass
    const warlock = this.ddbParser?.ddbCharacter?.raw?.classes?.find((klass) => klass.name === "Warlock");
    return {
      data: {
        ...(warlock ? { flags: { dnd5e: { advancementRoot: warlock._id } } } : {}),
        // pins the key the duration scale is read under
        system: {
          identifier: "form-of-the-beast",
        },
      },
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Form of the Beast",
        max: "2",
        period: "sr",
      }),
    };
  }

}
