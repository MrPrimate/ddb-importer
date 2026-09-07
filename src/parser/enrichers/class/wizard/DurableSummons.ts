import DDBEnricherData from "../../data/DDBEnricherData";

export default class DurableSummons extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Durable Summons",
      targetType: "creature",
      activationType: "special",
      activationCondition: "When a Conjuration spell summons or creates a creature",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "2 * @classes.wizard.levels",
          types: ["temphp"],
        }),
        range: { units: "spec" },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return { uses: { spent: null, max: "", recovery: [] } };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Durable Summons: Resistances",
        activityMatch: "Durable Summons",
        changes: DDBEnricherData.allDamageTypes(["force", "necrotic", "psychic", "radiant"])
          .map((type) => DDBEnricherData.ChangeHelper.damageResistanceChange(type)),
        options: {
          description: "Resistance to every damage type except Force, Necrotic, Psychic and Radiant while the temporary hit points last.",
        },
      },
    ];
  }

}
