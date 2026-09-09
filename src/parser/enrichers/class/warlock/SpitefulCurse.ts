import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Spiteful Curse is implemented on the Malediction feature, which carries the Cast Bestow
 * Curse activity. This feature keeps no activity of its own, only the once per long rest
 * pool that activity spends by name.
 */
export default class SpitefulCurse extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: 0,
        max: "1",
        recovery: [
          {
            period: "lr",
            type: "recoverAll",
          },
        ],
      },
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbSpitefulCurse">
<p><strong>Implementation Details</strong></p>
<p>The free Bestow Curse is the Cast Bestow Curse activity on your Malediction feature. This feature only tracks the use, which that activity spends.</p>
<p>The use is not expended when the target succeeds on its saving throw, so restore it by hand on a success.</p>
<p>Choosing a Malediction curse for the target to suffer instead on a successful save is manual; apply it from the Malediction feature.</p>
</section>`,
    };
  }

}
