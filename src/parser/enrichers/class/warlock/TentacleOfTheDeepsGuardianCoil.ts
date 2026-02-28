import DDBEnricherData from "../../data/DDBEnricherData";

export default class TentacleOfTheDeepsGuardianCoil extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity() {
    return {
      name: "Reduce Damage",
      targetType: "self",
      type: "heal",
      data: {
        "consumption.targets": [],
        // roll: {
        //   prompt: false,
        //   visible: false,
        //   formula: "1d10 + @abilities.dex.mod + @classes.monk.levels",
        //   name: "Reduce Damage Amount",
        // },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.the-fathomless.guardian-coil",
          types: ["healing"],
        }),
      },
    };
  }

}
