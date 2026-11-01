import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Coven Patron (OTFY). Once per Short or Long Rest, after taking 10 or more damage from an enemy (or
 * automatically on dropping to 0 Hit Points), heal 1d10 + Charisma modifier and pick one benefit
 * until the end of your next turn. One effect per benefit; Midi prompts for the one picked.
 */
export default class DistantProtections extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Distant Protections",
      activationType: "reaction",
      activationCondition: "You take 10 or more damage from an enemy, or are reduced to 0 Hit Points but not killed outright",
      addItemConsume: true,
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "@abilities.cha.mod",
          types: ["healing"],
        }),
        midiProperties: { chooseEffects: true },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const options: IDDBEffectOptions = { expiry: "sourceEnd" };
    return [
      {
        name: "Distant Protections: +5 AC",
        options,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("5", 20, "system.attributes.ac.bonus"),
        ],
      },
      {
        name: "Distant Protections: Invisible",
        options,
        statuses: ["invisible"],
      },
      {
        name: "Distant Protections: Fly Speed",
        options,
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Distant Protections",
        max: "1",
        period: "sr",
      }),
    };
  }

}
