import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The Magus Class. The Reaction gives the caster 5 Temporary Hit Points per slot level and makes
 * the attacker save (Strength) or fall Prone. DDB's temporary Hit Point modifier has no value, so
 * the parser's own healing sibling rolled nothing and picked up the Prone link.
 */
export default class TowerfallTactic extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      stopHealSpellActivity: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Temporary Hit Points",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateHealing: true,
          generateConsumption: false,
          generateActivation: true,
          noSpellslot: true,
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "5 * @item.level",
            types: ["temphp"],
            scalingMode: "none",
          }),
        },
        overrides: {
          targetType: "self",
          rangeSelf: true,
          noeffect: true,
        },
      },
    ];
  }

}
