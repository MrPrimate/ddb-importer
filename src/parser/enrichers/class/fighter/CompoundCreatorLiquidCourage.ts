import DDBEnricherData from "../../data/DDBEnricherData";

/** Living Crucible compound: Temporary Hit Points equal to twice your Fighter level plus your Constitution modifier, lost after a minute. */
export default class CompoundCreatorLiquidCourage extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Temporary Hit Points",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateHealing: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "You consume Liquid Courage",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "2 * @classes.fighter.levels + @abilities.con.mod",
            types: ["temphp"],
          }),
        },
        overrides: {
          targetSelf: true,
        },
      },
    ];
  }

}
