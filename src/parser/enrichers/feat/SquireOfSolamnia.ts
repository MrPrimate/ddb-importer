import DDBEnricherData from "../data/DDBEnricherData";

export default class SquireOfSolamnia extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        // Precise Strike advantage is offered as an AC5e opt-in once per turn;
        // the default damage activity remains the 1d8 bonus claim
        name: "Precise Strike",
        ac5eOnly: true,
        options: {
          transfer: true,
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "optin; oncePerTurn; name=Precise Strike; description=Cause this weapon attack roll to have advantage.",
            20,
            "flags.automated-conditions-5e.attack.advantage",
          ),
        ],
      },
    ];
  }

}
