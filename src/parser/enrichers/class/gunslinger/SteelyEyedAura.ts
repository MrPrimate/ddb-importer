import DDBEnricherData from "../../data/DDBEnricherData";

export default class SteelyEyedAura extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Place Aura",
      targetType: "ally",
      activationType: "special",
      data: {
        target: {
          template: {
            contiguous: false,
            type: "radius",
            size: "@scale.white-hat.steely-eyed-aura",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: this.data.name,
            auraeffectsNever: true,
          }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Steely-Eyed Aura",
        standalone: true,
        auraeffectsNever: true,
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "riderStatuses.frightened",
            20,
            "flags.automated-conditions-5e.save.advantage",
          ),
        ],
        options: {
          description: "Advantage on saving throws made to avoid or end the Frightened condition.",
        },
      },
      {
        name: "Steely-Eyed Aura",
        auraeffectsOnly: true,
        options: {
          transfer: true,
          description: "You and allies within the Emanation have Advantage on saving throws made to avoid or end the Frightened condition. Inactive while you are Incapacitated.",
        },
        daeStackable: "noneNameOnly",
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "@scale.white-hat.steely-eyed-aura",
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }

}
