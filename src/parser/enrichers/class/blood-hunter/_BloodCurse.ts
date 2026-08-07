import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodHunter from "./_BloodHunter";

/**
 * Shared behaviour for the Blood Hunter's Blood Curses.
 *
 * Each curse document carries three kinds of activity: the base curse, an
 * "(Amplified)" variant, and the "Amplify Curse" activity that pays the
 * amplify cost (necrotic damage equal to one roll of the hemocraft die).
 *
 * The leading underscore keeps this out of the name lookup - pascalCase of a
 * DDB feature name can never start with one - while still being exported by
 * the generated barrel.
 */
export default class _BloodCurse extends _BloodHunter {

  static AMPLIFY_NAME = "Amplify Curse";

  static AMPLIFY_CONDITION = "Amplify the curse by taking hemocraft die damage";

  /** The curse name, used for the base and "(Amplified)" activity names. */
  get curseName(): string {
    return this.name;
  }

  get amplifiedName(): string {
    return `${this.curseName} (Amplified)`;
  }

  /** The self damage that pays for amplifying a curse. */
  get amplifyCostActivity(): IDDBAdditionalActivity {
    return {
      init: {
        name: _BloodCurse.AMPLIFY_NAME,
        type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
      },
      build: {
        noeffect: true,
        generateActivation: true,
        generateTarget: true,
        generateDamage: true,
        activationOverride: {
          type: "special",
          value: null,
          condition: _BloodCurse.AMPLIFY_CONDITION,
        },
        damageParts: [
          DDBEnricherData.basicDamagePart({
            customFormula: _BloodCurse.DIE,
            types: ["necrotic"],
          }),
        ],
        allowCritical: false,
      },
      overrides: {
        targetType: "self",
        rangeSelf: true,
        // the cost is paid by the blood hunter, never by the curse's resource
        noConsumeTargets: true,
      },
    };
  }

  /**
   * Activities that must not pick up the Blood Maledict use that
   * CONSUMPTION_LINKS otherwise adds to every activity on the document.
   * The base and amplified activities both spend a use; nothing else does.
   */
  get ignoredConsumptionActivities(): string[] {
    return [_BloodCurse.AMPLIFY_NAME];
  }

  get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: this.ignoredConsumptionActivities,
    };
  }

}
