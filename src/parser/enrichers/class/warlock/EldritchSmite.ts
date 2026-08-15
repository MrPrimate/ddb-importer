import DDBEnricherData from "../../data/DDBEnricherData";

export default class EldritchSmite extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Eldritch Smite (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage on a pact weapon hit, expending a Pact Magic spell slot. Apply the Prone rider to Huge or smaller targets manually.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=(1 + @spells.pact.level)d8[force]; usesCount=spells.pact; oncePerTurn; optin; actionType.mwak || actionType.rwak",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
