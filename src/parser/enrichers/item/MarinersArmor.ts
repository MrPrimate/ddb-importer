import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Mariner's Armor: a swim speed equal to walking speed while worn, plus the 1d4 recovery when starting a turn underwater at 0 hit points.
 */
export default class MarinersArmor extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Underwater Recovery",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateHealing: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          activationOverride: { type: "special", value: null, condition: "You start your turn underwater with 0 Hit Points" },
          healingPart: DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["healing"] }),
          targetOverride: { affects: { count: "", type: "self", choice: false, special: "" } },
        },
        overrides: {
          rangeSelf: true,
        },
      },
    ];
  }

}
