import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * 2014: regain one Bardic Inspiration when rolling initiative with none left. The 2024 printing
 * refills up to two, which needs the Bardic Inspiration item's own uses in the cost formula, so
 * that activity lives on Bardic Inspiration behind a level 18 visibility gate (the dnd5e SRD shape)
 * and this feature only carries the rule text.
 */
export default class SuperiorInspiration extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : null;
  }

  override get stopDefaultActivity(): boolean {
    return !this.is2014;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.is2014) return null;
    return {
      name: "Regain 1 Use",
      addItemConsume: true,
      itemConsumeValue: "-1",
      activationType: "encounter",
      activationCondition: "When you roll initiative and have no uses of Bardic Inspiration",
    };
  }

  override get override(): IDDBOverrideData | null {
    if (this.is2014) return null;
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbSuperiorInspiration">
<p><strong>Implementation Details</strong></p>
<p>This is handled by the Regain Inspiration activity on Bardic Inspiration, which becomes available at Bard level 18.</p>
</section>`,
    };
  }

}
