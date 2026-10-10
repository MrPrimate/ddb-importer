import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Magus level 11. DDB's options here only record which Mystic Mark benefit is active ("Active
 * Mystic Mark: Enspell (Fire)"), so they build no documents: the Enspell 1d6 rides on the Mystic
 * Mark Enspell effects, and the Aegis start-of-turn temporary Hit Points are this activity, with
 * the expended slot level picked as the scaling.
 */
export default class SigilSurge extends DDBEnricherData {

  override get noChoiceBuild(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Aegis Temporary Hit Points",
      activationType: "special",
      activationCondition: "Start of each of your turns while your Mystic Mark has Aegis; choose the expended slot level as the scaling",
      targetType: "self",
      rangeSelf: true,
      noConsumeTargets: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scaling + @abilities.int.mod",
          types: ["temphp"],
          scalingMode: "none",
        }),
        consumption: {
          scaling: {
            allowed: true,
            max: "5",
          },
        },
      },
    };
  }

}
