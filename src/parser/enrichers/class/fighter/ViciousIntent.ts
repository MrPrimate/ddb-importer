import DDBEnricherData from "../../data/DDBEnricherData";

export default class ViciousIntent extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Vicious Intent",
        ac5eOnly: true,
        options: {
          transfer: true,
        },
        ac5eChanges: [
          // firearm attacks crit on 19-20; approximated to ranged weapon attacks
          DDBEnricherData.ChangeHelper.addChange(
            "bonus=(actionType.rwak ? 1 : 0)",
            20,
            "flags.automated-conditions-5e.attack.criticalThreshold",
          ),
        ],
      },
    ];
  }

}
