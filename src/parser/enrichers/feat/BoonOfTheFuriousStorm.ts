import Generic from "./Generic";

export default class BoonOfTheFuriousStorm extends Generic {

  // DDB's modifiers give the resistances; the Bloodied immunity is a toggle beside them
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Eye of the Storm (Bloodied)",
        options: { transfer: true, disabled: true },
        changes: ["lightning", "thunder"].map((damageType) =>
          Generic.ChangeHelper.unsignedAddChange(damageType, 20, "system.traits.di.value"),
        ),
      },
    ];
  }

}
