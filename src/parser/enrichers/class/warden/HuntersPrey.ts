import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Free League Warden: the chosen prey feature. Foe-Hammer adds one weapon damage die, once per turn,
 * against a creature below its hit point maximum; AC5e offers it as an opt-in on weapon damage.
 */
export default class HuntersPrey extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get isFoeHammer(): boolean {
    const chosen = (this.ddbParser._chosen ?? []).map((choice) => choice.label ?? "");
    return chosen.includes("Foe-Hammer")
      || Object.values(this.data.system?.activities ?? {}).some((activity: any) => activity?.name === "Foe-Hammer");
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isFoeHammer) return [];
    return [
      {
        name: "Foe-Hammer (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Once per turn, a weapon hit against a creature below its hit point maximum can roll one additional weapon damage die.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=1; oncePerTurn; optin; (actionType.mwak || actionType.rwak) && opponentActor.attributes.hp.pct < 100",
            20,
            "flags.automated-conditions-5e.damage.extraDice",
          ),
        ],
      },
    ];
  }

}
