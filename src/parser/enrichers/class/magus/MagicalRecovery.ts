import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Magus level 6. After a Short Rest, recover spell slots totalling half the Magus level (rounded
 * up), none of level 6 or higher; Archmagus raises the uses to two. Runs the wizard's Arcane
 * Recovery picker against the Magus levels.
 */
export default class MagicalRecovery extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Magical Recovery",
      type: DDBEnricherData.ACTIVITY_TYPES.DDBMACRO,
      addItemConsume: true,
      activationType: "shortRest",
      activationCondition: "When you finish a Short Rest",
      data: {
        macro: {
          name: "Magical Recovery",
          function: "ddb.feat.arcaneRecovery",
          visible: false,
          parameters: JSON.stringify({ classIdentifier: "magus" }),
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Magical Recovery",
        max: "1 + floor(@classes.magus.levels / 20)",
        period: "lr",
      }),
    };
  }

}
