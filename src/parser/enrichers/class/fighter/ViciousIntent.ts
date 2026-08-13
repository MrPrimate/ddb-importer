import DDBEnricherData from "../../data/DDBEnricherData";

export default class ViciousIntent extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Vicious Intent",
        ac5eOnly: true,
        options: {
          transfer: true,
        },
        ac5eChanges: [
          // firearm attacks crit on 19-20; approximated to ranged weapon attacks
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=(actionType.rwak ? 1 : 0)",
            20,
            "flags.automated-conditions-5e.attack.criticalThreshold",
          ),
        ],
      },
    ];
  }

}
