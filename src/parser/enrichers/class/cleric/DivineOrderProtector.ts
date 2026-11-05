import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Protector's Heavy armor and Martial weapon training, as the SRD's Trait advancement. A character import already has the proficiencies
 * from DDB's modifiers, so there the advancement is recorded as applied and changes nothing.
 */
export default class DivineOrderProtector extends DDBEnricherData {

  override get additionalAdvancements(): I5eAdvancement[] {
    return [
      DDBEnricherData.AdvancementBuilder.buildTraitGrant({
        name: "Protector Training",
        level: 1,
        grants: ["armor:hvy", "weapon:mar"],
        applied: !this.ddbParser.isMuncher,
      }),
    ];
  }

}
