import DDBEnricherData from "../data/DDBEnricherData";

/**
 * One enricher for every rarity of the shovel. The necrotic resistance aura arrives at Very Rare,
 * so the +1 (Rare) variant keeps only its weapon attack; the unsuffixed "rarity varies" entry
 * lists every property and gets the aura too. The aura is a 10-foot emanation around the holder,
 * carried as an Active Auras / Aura Effects hint on the holder's own resistance; without either
 * module only the holder gains it.
 */
export default class ShovelOfYorgrim extends DDBEnricherData {

  get hasDenyDeathsTouch(): boolean {
    return !(/,\s*\+1\s*$/).test(this.name);
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.hasDenyDeathsTouch) return [];
    return [
      {
        name: "Deny Death's Touch",
        daeStackable: "noneNameOnly",
        changes: [DDBEnricherData.ChangeHelper.damageResistanceChange("necrotic")],
        options: {
          transfer: true,
          description: "While holding the shovel, you and your allies within 10 feet of you have Resistance to Necrotic damage.",
        },
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: "10",
              isAura: true,
              ignoreSelf: false,
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
          distanceFormula: "10",
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }

}
