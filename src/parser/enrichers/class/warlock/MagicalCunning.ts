import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The 1 minute rite regains half the Pact Magic slots; from Warlock 20 Eldritch Master makes it
 * regain all of them. Both are level-gated activities spending the same use, as the official SRD
 * item has them, so munched copies follow the character's level.
 */
export default class MagicalCunning extends DDBEnricherData {

  static MASTER_LEVEL = 20;

  get warlock(): string {
    return this.classIdentifier("Warlock");
  }

  get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Perform Esoteric Rite",
      targetType: "self",
      activationType: "minute",
      additionalConsumptionTargets: [
        {
          type: "attribute",
          value: "-(ceil(@spells.pact.max / 2))",
          target: "spells.pact.value",
        },
      ],
      data: {
        visibility: { identifier: this.warlock, level: { min: null, max: MagicalCunning.MASTER_LEVEL - 1 } },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Perform Master Rite",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
        },
        overrides: {
          targetType: "self",
          activationType: "minute",
          noConsumeTargets: true,
          addItemConsume: true,
          additionalConsumptionTargets: [
            {
              type: "attribute",
              value: "-@spells.pact.max",
              target: "spells.pact.value",
            },
          ],
          data: {
            visibility: { identifier: this.warlock, level: { min: MagicalCunning.MASTER_LEVEL, max: null } },
          },
        },
      },
    ];
  }

}
