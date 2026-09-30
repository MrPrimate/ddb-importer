import DDBEnricherData from "../data/DDBEnricherData";

/**
 * AU 2024. Monster Primer is an Intelligence (Arcana) check made with the Study action.
 * Extensive Knowledge grants proficiency in one of four skills while attuned, re-picked after a
 * Long Rest, so each skill is a disabled transfer effect for the player to switch on. The
 * Charm Monster cast is DDB's item spell and keeps DDB's activity.
 */
export default class ArcanistsBestiary extends DDBEnricherData {

  static SKILLS: { id: string; label: string }[] = [
    { id: "arc", label: "Arcana" },
    { id: "his", label: "History" },
    { id: "nat", label: "Nature" },
    { id: "rel", label: "Religion" },
  ];

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Monster Primer",
          type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
        },
        build: {
          generateCheck: true,
          generateActivation: true,
          generateTarget: false,
          generateRange: false,
          checkOverride: {
            associated: ["arc"],
            ability: "int",
            dc: { calculation: "", formula: "" },
          },
          activationOverride: {
            type: "action",
            value: 1,
            condition: "Study action about an Aberration, Construct, Elemental, Fey or Monstrosity you can see; success reveals its Immunities, Resistances and Vulnerabilities",
          },
        },
        overrides: {
          noConsumeTargets: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return ArcanistsBestiary.SKILLS.map((skill) => ({
      name: `Extensive Knowledge: ${skill.label}`,
      options: {
        transfer: true,
        disabled: true,
        description: `Proficiency in ${skill.label} while attuned; enable one skill, changed after a Long Rest.`,
      },
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("1", 20, `system.skills.${skill.id}.value`),
      ],
    }));
  }

}
