import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverAxolotlsRegeneration extends DDBEnricherData {

  override get builtFeaturesFromActionFilters(): string[] {
    return ["Axolotl's Regeneration: Heal", "Axolotl's Regeneration: Regrow"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  // "spend 2 or 6 maneuver points" does not match the parser's consumption
  // wording, and the two spends do different things, so both are declared here
  override get activity(): IDDBActivityData {
    return {
      name: "Regenerate (2 Points)",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "maneuver-points",
      itemConsumeValue: 2,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 12,
          bonus: "@abilities.con.mod",
          type: "healing",
        }),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Regenerate and Regrow (6 Points)",
          type: "heal",
        },
        build: {
          generateHealing: true,
          generateTarget: true,
          generateActivation: true,
          generateConsumption: true,
          healingPart: DDBEnricherData.basicDamagePart({
            number: 1,
            denomination: 12,
            bonus: "@abilities.con.mod",
            type: "healing",
          }),
        },
        overrides: {
          targetType: "self",
          activationType: "bonus",
          noConsumeTargets: true,
          additionalConsumptionTargets: [
            { type: "itemUses", target: "maneuver-points", value: 6 },
          ],
          data: {
            description: {
              chatFlavor: "You also regrow a lost limb or organ of your choice.",
            },
          },
        },
      },
    ];
  }

}
