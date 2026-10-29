import { DICTIONARY } from "../../../../config/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class BreathWeapon extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    if (!this.isAction) return DDBEnricherData.ACTIVITY_TYPES.NONE;
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      rangeSelf: true,
    };
  }


  // get override(): IDDBOverrideData {
  //   console.warn(this);
  //   const uses = this._getUsesWithSpent({
  //     type: "race",
  //     name: this.data.name,
  //   });
  //   return {
  //     data: {
  //       system: {
  //         uses,
  //       },
  //     },
  //   };
  // }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  /**
   * The damage type picked as this breath weapon's option when the option is a bare damage type
   * (Grim Hollow dragonborn: "Breath Weapon: Acid"). Effects are built before the option rename,
   * so the pick is read from the chosen option.
   */
  get chosenDamageType(): string | null {
    const labels = (this.ddbParser._chosen ?? []).map((choice) => (choice.label ?? "").trim().toLowerCase());
    const adjustment = DICTIONARY.actor.damageAdjustments
      .find((entry) => entry.type === 1 && entry.foundryValues?.value?.length === 1 && labels.includes(entry.name.toLowerCase()));
    return adjustment?.foundryValues?.value?.[0] ?? null;
  }

  /**
   * DDB gives the Grim Hollow dragonborn's Damage Resistance no options of its own: it is "Same as
   * your breath weapon", so the breath weapon's pick carries the resistance.
   */
  get resistanceFollowsBreath(): boolean {
    const traits = this.ddbParser.ddbData?.character?.race?.racialTraits ?? [];
    return traits.some((trait) => trait.definition.name === "Damage Resistance"
      && (/same as your breath weapon/i).test(trait.definition.description ?? ""));
  }

  override get effects(): IDDBEffectHint[] {
    const damageType = this.chosenDamageType;
    if (!damageType || !this.resistanceFollowsBreath) return [];
    const label = damageType.charAt(0).toUpperCase() + damageType.slice(1);
    return [
      {
        name: `Damage Resistance: ${label}`,
        options: {
          transfer: true,
          description: `You have Resistance to ${label} damage, the damage type of your Breath Weapon.`,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(damageType, 20, "system.traits.dr.value"),
        ],
      },
    ];
  }

}
