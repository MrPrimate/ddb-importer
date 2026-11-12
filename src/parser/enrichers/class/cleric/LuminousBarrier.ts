import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Discipline Domain (World of Warcraft) and the WoW Priest's Discipline Specialization: a Bonus
 * Action spending Channel Divinity wards each creature blessed by Atonement with Temporary Hit Points
 * equal to the Cleric (or Priest) levels + Wis mod, and Resistance to all damage while they last.
 */
export default class LuminousBarrier extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Ward",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      targetType: "creature",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: `@classes.${this.classIdentifier("Cleric")}.levels + @abilities.wis.mod`,
          types: ["temphp"],
        }),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Luminous Barrier",
        options: {
          transfer: false,
          description: "While you have Temporary Hit Points from Luminous Barrier, you have Resistance to all damage.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("ALL"),
        ],
      },
    ];
  }

}
