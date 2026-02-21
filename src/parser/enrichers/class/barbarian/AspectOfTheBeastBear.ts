import DDBEnricherData from "../../data/DDBEnricherData";

export default class AspectOfTheBeastBear extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("1", 20, "system.attributes.encumbrance.multipliers.overall"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.str.save.roll.mode"),
        ],
      },
    ];
  }

}
