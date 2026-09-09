import DDBEnricherData from "../../data/DDBEnricherData";

export default class PetalDance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    if (this.isAction) return {};
    return {
      name: "Conjure Petals",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Wild Shape",
      data: {
        range: { value: "30", units: "ft", special: "" },
        duration: { value: "1", units: "hour", special: "" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Petal Dance: Lunge",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateRange: true,
          generateTarget: true,
          generateDamage: true,
          generateConsumption: false,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
          rangeOverride: {
            value: "30",
            units: "ft",
            special: "",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.petal.petal-dance + @mod",
              types: ["slashing"],
            }),
          ],
        },
        overrides: {
        },
      },
      {
        init: {
          name: "Petal Dance: Protection",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateRange: true,
          generateTarget: true,
          generateHealing: true,
          generateConsumption: false,
          chatFlavor: "The cloud dissipates once it has protected in this way.",
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "When you or a creature you can see takes damage",
          },
          rangeOverride: {
            value: "30",
            units: "ft",
            special: "",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "@classes.druid.levels + @abilities.wis.mod",
            type: "healing",
          }),
        },
        overrides: {
        },
      },
    ];
  }

}
