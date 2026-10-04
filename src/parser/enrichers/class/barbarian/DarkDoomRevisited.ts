import DDBEnricherData from "../../data/DDBEnricherData";

interface IDoomOption {
  name: string;
  ability: string;
  dcAbility: string;
  size: string;
  damageType: string;
}

/**
 * Path of the Wrathful Dead: once per Rage, a Magic action channels a traumatic death as one of three
 * emanation saves, each dealing a number of d6 equal to the Rage Damage bonus. Hypothermia and
 * Immolation repeat their damage at the start of the creature's turns; the effects carry that as text.
 */
export default class DarkDoomRevisited extends DDBEnricherData {

  static OPTIONS: IDoomOption[] = [
    { name: "Contamination", ability: "con", dcAbility: "con", size: "10", damageType: "poison" },
    { name: "Hypothermia", ability: "con", dcAbility: "str", size: "10", damageType: "cold" },
    { name: "Immolation", ability: "dex", dcAbility: "con", size: "15", damageType: "fire" },
  ];

  static optionData(option: IDoomOption): IDDBActivityData {
    return {
      name: option.name,
      targetType: "creature",
      activationType: "action",
      activationCondition: "Once per Rage",
      rangeSelf: true,
      data: {
        save: {
          ability: [option.ability],
          dc: {
            calculation: "",
            formula: `8 + @abilities.${option.dcAbility}.mod + @prof`,
          },
        },
        target: {
          override: true,
          affects: { type: "creature", choice: true },
          template: { type: "radius", size: option.size, units: "ft", contiguous: false },
        },
        damage: {
          onSave: "none",
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "(@scale.barbarian.rage-damage)d6",
              types: [option.damageType],
            }),
          ],
        },
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return DarkDoomRevisited.optionData(DarkDoomRevisited.OPTIONS[0]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return DarkDoomRevisited.OPTIONS.slice(1).map((option) => ({
      init: {
        name: option.name,
        type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
      },
      build: {
        generateSave: true,
        generateDamage: true,
        generateTarget: true,
        generateActivation: true,
        generateRange: true,
      },
      overrides: DarkDoomRevisited.optionData(option),
    }));
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Contamination",
        activityMatch: "Contamination",
        statuses: ["Poisoned"],
        options: {
          durationSeconds: 60,
          description: "Poisoned. The creature can take an action to end the condition on itself.",
        },
      },
      {
        name: "Hypothermia",
        activityMatch: "Hypothermia",
        options: {
          durationSeconds: 60,
          description: "Speed halved, and the creature takes the Cold damage again at the start of each of its turns. It can take an action to end the effect on itself.",
        },
        changes: [DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5")],
      },
      {
        name: "Immolation",
        activityMatch: "Immolation",
        options: {
          description: "The creature takes the Fire damage again at the start of each of its turns. It can take an action to fall Prone and roll to put the fire out; dousing, submerging or suffocating it also works.",
        },
      },
    ];
  }

}
