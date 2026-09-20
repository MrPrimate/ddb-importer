import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Passive Blood Point maximum increase (+Con modifier, minimum 1); the DDB action
 * would otherwise attach as a junk activity. The increase is an effect on the
 * Kindred Blood Points scale value, which the Blood Potency pool reads as its maximum.
 */
export default class VitaeConcentration extends DDBEnricherData {

  /**
   * The Blood Point increase as a literal. Scale values are plain numbers changed before
   * ability modifiers are derived, so a change there can carry neither `@abilities.con.mod`
   * nor a `max()` formula (both cast to 0). The modifier is read at import instead, and a
   * compendium build with no character takes the minimum of 1.
   */
  get bloodPointIncrease(): number {
    const mod = foundry.utils.getProperty(this.ddbParser?.ddbCharacter ?? {}, "abilities.withEffects.con.mod");
    return Math.max(1, Number.isFinite(mod) ? mod as number : 1);
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Vitae Concentration",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange(
            `${this.bloodPointIncrease}`,
            20,
            "system.scale.kindred.blood-points.value",
          ),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      // DDB ships the increase as a limited use on the junk action, which is not a pool to spend
      uses: {
        spent: null,
        max: null,
        recovery: [],
      },
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbVitaeConcentration">
<p><strong>Implementation Details</strong></p>
<p>The Blood Point maximum increase is an effect on the Kindred Blood Points scale value. A scale value cannot read an ability modifier, so the effect holds the Constitution modifier from the last import - reimport, or edit the effect, if your Constitution changes.</p>
</section>`,
    };
  }

}
