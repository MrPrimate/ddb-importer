import DDBEnricherData from "../data/DDBEnricherData";

/** Iron Gut: once per short or long rest, a Bonus Action spends a Hit Point Die to heal its roll plus your Constitution modifier. */
export default class QuickToRecover extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return ["Smallest", "Largest"].map((size) => ({
      init: {
        name: `Healing - ${size} Hit Die`,
        type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
      },
      build: {
        generateConsumption: true,
        generateTarget: false,
        targetSelf: true,
        generateRange: false,
        generateActivation: true,
        generateHealing: true,
        activationOverride: { type: "bonus" },
        healingPart: DDBEnricherData.basicDamagePart({
          customFormula: `@attributes.hd.${size.toLowerCase()}Available + @abilities.con.mod`,
          types: ["healing"],
        }),
        consumptionOverride: {
          targets: [
            { type: "itemUses", target: "", value: "1", scaling: { mode: "", formula: "" } },
            { type: "hitDice", target: size.toLowerCase(), value: "1", scaling: { mode: "", formula: "" } },
          ],
          scaling: { allowed: false, max: "" },
        },
      },
    }));
  }

}
