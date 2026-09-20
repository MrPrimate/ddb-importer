import DDBEnricherData from "../data/DDBEnricherData";

/**
 * A charge fires a bolt whose vacuum rolls a Strength save at once and makes its 20-foot-radius
 * circle difficult terrain until the start of the wielder's next turn, when the point erupts for
 * a second save. The eruption is its own save used by hand over the same area.
 */
export default class RiptideCrossbow extends DDBEnricherData {

  // the parser turns the eruption's damage into a second weapon attack, which it is not
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Spectral Tides", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: false,
          saveOverride: { ability: ["str"], dc: { calculation: "", formula: "15" } },
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateConsumption: false,
          activationOverride: {
            type: "action",
            value: null,
            condition: "Pulled 15 feet toward the point on a failure, 5 feet on a success; the area is difficult terrain until the start of your next turn",
          },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, units: "ft", type: "circle", size: "20" },
          },
          rangeOverride: { override: true, value: "100", units: "ft" },
          durationOverride: { override: true, value: "1", units: "round" },
        },
        overrides: {
          addItemConsume: true,
          noeffect: true,
          data: {
            damage: { onSave: "none" },
          },
        },
      },
      {
        init: { name: "Eruption", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: true,
          saveOverride: { ability: ["str"], dc: { calculation: "", formula: "15" } },
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 3, denomination: 10, types: ["bludgeoning"] }),
          ],
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: false,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Start of your next turn after Spectral Tides",
          },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, units: "ft", type: "circle", size: "20" },
          },
          rangeOverride: { override: true, value: "100", units: "ft" },
        },
        overrides: {
          noConsumeTargets: true,
          data: {
            damage: { onSave: "half" },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone",
        activityMatch: "Eruption",
        statuses: ["Prone"],
        options: { transfer: false },
      },
    ];
  }

}
