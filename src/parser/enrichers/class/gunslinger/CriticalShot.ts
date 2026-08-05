import DDBEnricherData from "../../data/DDBEnricherData";

export default class CriticalShot extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Critical Shot",
        ac5eOnly: true,
        options: {
          transfer: true,
        },
        ac5eChanges: [
          // automated-conditions-5e: expanded critical range for ranged weapon
          // attacks; the scale value holds the threshold (19, then 18, then 17)
          DDBEnricherData.ChangeHelper.addChange(
            "bonus=(actionType.rwak? @scale.gunslinger.critical-shot : 0)",
            20,
            "flags.automated-conditions-5e.attack.criticalThreshold",
          ),
        ],
      },
    ];
  }

}
