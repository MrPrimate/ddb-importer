import RiderEnchantmentLink from "../../../src/effects/enhancers/Enchantments/RiderEnchantmentLink";

const SPELL_UUID = "Actor.aaaaaaaaaaaaaaaa.Item.spellspellspell0";
const GRANTING = { id: "grantingEffect00", uuid: `${SPELL_UUID}.ActiveEffect.grantingEffect00` };

/** A rider activity copy on the spell: dnd5e stamps it as dependent on the applied enchantment. */
function riderActivity({ dependentOn = GRANTING.id, effects = [GRANTING] } = {}) {
  return {
    flags: { dnd5e: dependentOn ? { dependentOn } : {} },
    item: {
      uuid: SPELL_UUID,
      effects: { get: (id: string) => effects.find((effect) => effect.id === id) },
    },
  };
}

const STRIKE = { uuid: "Actor.aaaaaaaaaaaaaaaa.Item.unarmedstrike000" };

describe("RiderEnchantmentLink.preApplyEnchantmentHook", () => {
  it("makes an enchantment on another item depend on the granting enchantment, by uuid", () => {
    const data: any = { flags: { dnd5e: { enchantmentProfile: "profile000000000" } } };
    const result = RiderEnchantmentLink.preApplyEnchantmentHook(STRIKE, data, { activity: riderActivity() });
    expect(data.flags.dnd5e).toEqual({ enchantmentProfile: "profile000000000", dependentOn: GRANTING.uuid });
    // never vetoes the enchantment
    expect(result).toBeUndefined();
  });

  it("uses the bare effect id when the rider enchants its own item", () => {
    const data: any = { flags: {} };
    RiderEnchantmentLink.preApplyEnchantmentHook({ uuid: SPELL_UUID }, data, { activity: riderActivity() });
    expect(data.flags.dnd5e.dependentOn).toBe(GRANTING.id);
  });

  it("creates the flags when the data has none", () => {
    const data: any = {};
    RiderEnchantmentLink.preApplyEnchantmentHook(STRIKE, data, { activity: riderActivity() });
    expect(data.flags.dnd5e.dependentOn).toBe(GRANTING.uuid);
  });

  it("leaves a link dnd5e already made to concentration alone", () => {
    const data: any = { flags: { dnd5e: { dependentOn: "Actor.aaaaaaaaaaaaaaaa.ActiveEffect.concentration000" } } };
    RiderEnchantmentLink.preApplyEnchantmentHook(STRIKE, data, { activity: riderActivity() });
    expect(data.flags.dnd5e.dependentOn).toBe("Actor.aaaaaaaaaaaaaaaa.ActiveEffect.concentration000");
  });

  it("does nothing for an activity that is not a rider copy, or whose granting enchantment is gone", () => {
    for (const activity of [riderActivity({ dependentOn: "" }), riderActivity({ effects: [] }), null, undefined]) {
      const data: any = { flags: { dnd5e: {} } };
      expect(RiderEnchantmentLink.preApplyEnchantmentHook(STRIKE, data, { activity })).toBeUndefined();
      expect(data.flags.dnd5e.dependentOn).toBeUndefined();
    }
  });
});
