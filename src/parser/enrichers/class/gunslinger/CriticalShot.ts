import DDBEnricherData from "../../data/DDBEnricherData";

export default class CriticalShot extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Critical Shot",
        ac5eOnly: true,
        options: {
          transfer: true,
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "set=@scale.gunslinger.critical-shot; actionType.rwak",
            20,
            "flags.automated-conditions-5e.attack.criticalThreshold",
          ),
        ],
      },
    ];
  }

}
