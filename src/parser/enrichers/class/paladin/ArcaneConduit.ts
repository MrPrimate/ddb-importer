import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Oath of the Spelldrinker: a minute-long 30-foot field. Melee attackers take Force damage equal to
 * your Charisma modifier (minimum 1), and when you spend a spell slot friendly creatures in the field
 * heal that much while hostile ones take it as Force damage. The field is built here because a named
 * enricher without its own activity drops the one DDB's action would give.
 */
export default class ArcaneConduit extends DDBEnricherData {

  static amount = "max(1, @abilities.cha.mod)";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Arcane Conduit",
      targetType: "self",
      activationType: "action",
      addItemConsume: true,
      rangeSelf: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, type: "radius", size: "30", units: "ft" },
          prompt: false,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Arcane Conduit",
        activityMatch: "Arcane Conduit",
        options: {
          durationSeconds: 60,
          description: "Resistance to damage from spells and Advantage on saving throws against spells. Melee attackers take Force damage equal to your Charisma modifier (minimum 1), and expending a spell slot heals friendly creatures in the field by that amount and deals it as Force damage to hostile ones.",
        },
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const pulse = (name: string, type: IDDBActivityType, condition: string, part: I5eDamagePart, heal = false): IDDBAdditionalActivity => ({
      init: { name, type },
      build: {
        generateConsumption: false,
        generateTarget: true,
        generateActivation: true,
        generateDamage: !heal,
        generateHealing: heal,
        damageParts: heal ? undefined : [part],
        healingPart: heal ? part : undefined,
        activationOverride: { type: "special", value: 1, condition },
      },
      overrides: { targetType: "creature", noTemplate: true, noConsumeTargets: true },
    });
    return [
      pulse("Lashing Magic", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, "A creature hits you with a melee attack while the field lasts",
        DDBEnricherData.basicDamagePart({ customFormula: ArcaneConduit.amount, types: ["force"] })),
      pulse("Conduit Pulse: Allies", DDBEnricherData.ACTIVITY_TYPES.HEAL, "You expend a spell slot of 1st level or higher while the field lasts",
        DDBEnricherData.basicDamagePart({ customFormula: ArcaneConduit.amount, types: ["healing"] }), true),
      pulse("Conduit Pulse: Enemies", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, "You expend a spell slot of 1st level or higher while the field lasts",
        DDBEnricherData.basicDamagePart({ customFormula: ArcaneConduit.amount, types: ["force"] })),
    ];
  }

}
