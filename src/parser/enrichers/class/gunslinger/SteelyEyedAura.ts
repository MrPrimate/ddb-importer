import DDBEnricherData from "../../data/DDBEnricherData";

export default class SteelyEyedAura extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Steely-Eyed Aura",
        options: {
          transfer: true,
          description: "You and allies within the Emanation have Advantage on saving throws made to avoid or end the Frightened condition. Inactive while you are Incapacitated.",
        },
        daeStackable: "noneNameOnly",
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: "@scale.white-hat.steely-eyed-aura",
              isAura: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
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
