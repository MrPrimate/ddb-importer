import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Wild Companion casts Find Familiar for a use of Wild Shape; the 2024 feature also accepts a
 * spell slot, the 2014 one does not. The feature sits on the challenge-rating summon list, so the
 * parser fills the primary summon's familiar profiles; the spell-slot twin asks for the same
 * through its override function, the way Pact of the Chain does. The familiar is fey under both
 * rulesets, which the summon keeps as its only creature type.
 */
export default class WildCompanion extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Summon with Wild Shape",
      activationType: "action",
      noTemplate: true,
      addItemConsume: true,
      itemConsumeTargetName: "Wild Shape",
      data: {
        creatureTypes: ["fey"],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return [];
    return [
      {
        init: {
          name: "Summon with Spell Slot",
          type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
        },
        build: {
          generateSummon: true,
          generateActivation: true,
          generateConsumption: true,
          activationOverride: {
            type: "action",
            value: 1,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "spellSlots",
                value: "1",
                target: "1",
                scaling: { mode: "", formula: "" },
              },
            ],
            scaling: { allowed: true, max: "9" },
          },
        },
        overrides: {
          noTemplate: true,
          data: {
            creatureTypes: ["fey"],
          },
          func: async ({ activity }) => {
            await this.ddbParser.ddbCompanionFactory?.addCRSummoning(activity);
          },
        },
      },
    ];
  }

}
