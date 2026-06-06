import DDBEnricherData from "../../data/DDBEnricherData";

export default class PowerOfShadow extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  // Strength of the Grave. If you would drop to 0 Hit Points and not die outright,
  // you can make a Charisma saving throw (DC 5 plus the damage taken).
  // On a successful save, your Hit Points instead change to a number equal
  // to your Charisma modifier plus your Sorcerer level. After you succeed on this save,
  // you can’t use this benefit again until you finish a Long Rest.

  get activity(): IDDBActivityData {
    return {
      name: "Strength of the Grave",
      noConsumeTargets: true,
      targetType: "self",
      noeffect: true,
      activationType: "special",
      addScalingMode: "amount",
      addScalingFormula: "1",
      data: {
        save: {
          abilities: ["cha"],
          dc: {
            calculation: "",
            formula: "5 + @scaling",
          },
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      uses: this._getGeneratedUses({
        type: "class",
        name: "Strength of the Grave",
      }),
    };
  }

}
