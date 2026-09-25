import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Call the Hunt (Path of the Beast): entering a rage lets up to max(1, Con) willing creatures
 * within 30 feet join the hunting party for a minute (extra 1d6 damage once per turn), and the
 * barbarian gains 5 temporary hit points per creature that joins. The temporary hit points
 * scale with the number of creatures picked; the party entry consumes the feature's use.
 */
export default class CallTheHunt extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Temporary Hit Points",
      activationType: "special",
      activationCondition: "When you enter your rage; choose one scaling step per creature that joins the hunting party",
      targetType: "self",
      rangeSelf: true,
      noConsumeTargets: true,
      addScalingMode: "amount",
      addConsumptionScalingMax: "max(1, @abilities.con.mod)",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "5 * @scaling",
          types: ["temphp"],
        }),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Add to Hunting Party",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          generateDuration: true,
          generateUtility: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "When you enter your rage",
          },
          durationOverride: {
            value: "1",
            units: "minute",
          },
          targetOverride: {
            affects: {
              count: "max(1, @abilities.con.mod)",
              type: "willing",
              choice: false,
              special: "",
            },
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 30,
          addItemConsume: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hunting Party",
        activityMatch: "Add to Hunting Party",
        options: {
          durationSeconds: 60,
          description: "Once on each of your turns, deal an extra 1d6 damage when you hit a creature with an attack roll.",
        },
      },
    ];
  }

}
