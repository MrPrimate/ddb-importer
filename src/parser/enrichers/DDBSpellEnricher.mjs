import { SpellEnrichers } from "./_module.mjs";
import DDBEnricherMixin from "./mixins/DDBEnricherMixin.mjs";
import DDBEnricherData from "./data/DDBEnricherData.mjs";

export default class DDBSpellEnricher extends DDBEnricherMixin {
  constructor({ activityGenerator } = {}) {
    super({
      activityGenerator,
      effectType: "spell",
      enricherType: "spell",
    });
  }

  load({ ddbParser, document, name = null } = {}) {
    super.load({ ddbParser, document, name });
    this._prepare();
  }

  NAME_HINTS_2014 = {};

  NAME_HINTS = {
    "Bigby's Hand": "Arcane Hand",
    "Melf's Acid Arrow": "Acid Arrow",
    "Mordenkainen's Sword": "Arcane Sword",
    "Evard's Black Tentacles": "Black Tentacles",
  };

  ENRICHERS = {
    "Absorb Elements": SpellEnrichers.AbsorbElements,
    "Acid Arrow": SpellEnrichers.AcidArrow,
    "Aid": SpellEnrichers.Aid,
    "Alter Self": SpellEnrichers.AlterSelf,
    "Animate Objects": SpellEnrichers.AnimateObjects,
    "Arcane Eye": SpellEnrichers.ArcaneEye,
    "Arcane Hand": SpellEnrichers.ArcaneHand,
    "Arcane Sword": SpellEnrichers.ArcaneSword,
    "Arcane Vigor": SpellEnrichers.ArcaneVigor,
    "Armor of Agathys": SpellEnrichers.ArmorOfAgathys,
    "Aura of Life": SpellEnrichers.AuraOfLife,
    "Barkskin": SpellEnrichers.Barkskin,
    "Blade Ward": SpellEnrichers.BladeWard,
    "Bones of the Earth": SpellEnrichers.BonesOfTheEarth,
    "Booming Blade": SpellEnrichers.BoomingBlade,
    "Call Lightning": SpellEnrichers.CallLightning,
    "Catapult": SpellEnrichers.Catapult,
    "Chaos Bolt": SpellEnrichers.ChaosBolt,
    "Chromatic Orb": SpellEnrichers.ChromaticOrb,
    "Color Spray": SpellEnrichers.ColorSpray,
    "Command": SpellEnrichers.Command,
    "Control Weather": SpellEnrichers.ControlWeather,
    "Counterspell": SpellEnrichers.Counterspell,
    "Dancing Lights": SpellEnrichers.DancingLights,
    "Darkness": SpellEnrichers.Darkness,
    "Divine Favor": SpellEnrichers.DivineFavor,
    "Divine Smite": SpellEnrichers.DivineSmite,
    "Dragon's Breath": SpellEnrichers.DragonsBreath,
    "Eldritch Blast": SpellEnrichers.EldritchBlast,
    "Elemental Weapon": SpellEnrichers.ElementalWeapon,
    "Faerie Fire": SpellEnrichers.FaerieFire,
    "False Life": SpellEnrichers.FalseLife,
    "Fire Shield": SpellEnrichers.FireShield,
    "Flaming Sphere": SpellEnrichers.FlamingSphere,
    "Fount of Moonlight": SpellEnrichers.FountOfMoonlight,
    "Glyph of Warding": SpellEnrichers.GlyphOfWarding,
    "Green-Flame Blade": SpellEnrichers.GreenFlameBlade,
    "Gust of Wind": SpellEnrichers.GustOfWind,
    "Heat Metal": SpellEnrichers.HeatMetal,
    "Heroes' Feast": SpellEnrichers.HeroesFeast,
    "Heroism": SpellEnrichers.Heroism,
    "Hex": SpellEnrichers.Hex,
    "Hunger of Hadar": SpellEnrichers.HungerOfHadar,
    "Hunter's Mark": SpellEnrichers.HuntersMark,
    "Light": SpellEnrichers.Light,
    "Mage Hand": SpellEnrichers.MageHand,
    "Magic Weapon": SpellEnrichers.MagicWeapon,
    "Mass Suggestion": SpellEnrichers.MassSuggestion,
    "Power Word Fortify": SpellEnrichers.PowerWordFortify,
    "Prismatic Wall": SpellEnrichers.PrismaticWall,
    "Protection from Energy": SpellEnrichers.ProtectionFromEnergy,
    "Pyrotechnics": SpellEnrichers.Pyrotechnics,
    "Ray of Enfeeblement": SpellEnrichers.RayOfEnfeeblement,
    "Ray of Sickness": SpellEnrichers.RayOfSickness,
    "Scorching Ray": SpellEnrichers.ScorchingRay,
    "Searing Smite": SpellEnrichers.SearingSmite,
    "Shillelagh": SpellEnrichers.Shillelagh,
    "Sleep": SpellEnrichers.Sleep,
    "Sorcerous Burst": SpellEnrichers.SorcerousBurst,
    "Spider Climb": SpellEnrichers.SpiderClimb,
    "Spike Growth": SpellEnrichers.SpikeGrowth,
    "Spirit Guardians": SpellEnrichers.SpiritGuardians,
    "Spirit Shroud": SpellEnrichers.SpiritShroud,
    "Spiritual Weapon": SpellEnrichers.SpiritualWeapon,
    "Suggestion": SpellEnrichers.Suggestion,
    "Tasha's Bubbling Cauldron": SpellEnrichers.TashasBubblingCauldron,
    "Thunder Step": SpellEnrichers.ThunderStep,
    "Tidal Wave": SpellEnrichers.TidalWave,
    "Toll the Dead": SpellEnrichers.TollTheDead,
    "True Strike": SpellEnrichers.TrueStrike,
    "Vitriolic Sphere": SpellEnrichers.VitriolicSphere,
    "Wall of Fire": SpellEnrichers.WallOfFire,
    "Wall of Force": SpellEnrichers.WallOfForce,
    "Wall of Ice": SpellEnrichers.WallOfIce,
    "Wall of Light": SpellEnrichers.WallOfLight,
    "Wall of Sand": SpellEnrichers.WallOfSand,
    "Wall of Stone": SpellEnrichers.WallOfStone,
    "Wall of Thorns": SpellEnrichers.WallOfThorns,
    "Wall of Water": SpellEnrichers.WallOfWater,
    "Wind Wall": SpellEnrichers.WindWall,
    "Witch Bolt": SpellEnrichers.WitchBolt,
  };

  DOCUMENT_OVERRIDES = {
    "Primal Savagery": {
      data: {
        "system.range": {
          value: "5",
          units: "ft",
        },
      },
    },
    "Produce Flame": {
      data: {
        "system.range": {
          value: "30",
          units: "ft",
        },
      },
    },
    "Thunderclap": {
      data: {
        "system.range": {
          units: "spec",
        },
        "system.target": {
          template: {
            size: "15",
            type: "cube",
          },
        },
      },
    },
  };

  EFFECT_HINTS = {
    "Animal Friendship": {
      statuses: "Charmed",
    },
    "Bane": {
      changes: [
        DDBEnricherData.generateSignedAddChange("-1d4", 0, "system.bonuses.mwak.attack"),
        DDBEnricherData.generateSignedAddChange("-1d4", 0, "system.bonuses.rwak.attack"),
        DDBEnricherData.generateSignedAddChange("-1d4", 0, "system.bonuses.msak.attack"),
        DDBEnricherData.generateSignedAddChange("-1d4", 0, "system.bonuses.rsak.attack"),
        DDBEnricherData.generateSignedAddChange("-1d4", 20, "system.bonuses.abilities.save"),
      ],
    },
    "Bless": {
      options: {
        durationSeconds: 60,
      },
      changes: [
        DDBEnricherData.generateSignedAddChange("+1d4", 0, "system.bonuses.mwak.attack"),
        DDBEnricherData.generateSignedAddChange("+1d4", 0, "system.bonuses.rwak.attack"),
        DDBEnricherData.generateSignedAddChange("+1d4", 0, "system.bonuses.msak.attack"),
        DDBEnricherData.generateSignedAddChange("+1d4", 0, "system.bonuses.rsak.attack"),
        DDBEnricherData.generateSignedAddChange("+1d4", 20, "system.bonuses.abilities.save"),
      ],
      tokenMagicChanges: [
        DDBEnricherData.generateTokenMagicFXChange("bloom"),
      ],
    },
    "Chill Touch": {
      changes: [
        DDBEnricherData.generateUnsignedAddChange("healing", 30, "system.traits.di.value"),
      ],
    },
    "Darkvision": {
      changes: [
        DDBEnricherData.generateUpgradeChange("60", 20, "system.attributes.senses.darkvision"),
      ],
      atlChanges: [
        DDBEnricherData.generateATLChange("ATL.sight.range", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 60, 5),
        DDBEnricherData.generateATLChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "darkvision", 5),
      ],
    },
    "Feeblemind": {
      changes: [
        DDBEnricherData.generateOverrideChange("1", 20, "system.abilities.cha.value"),
        DDBEnricherData.generateOverrideChange("1", 20, "system.abilities.int.value"),
      ],
      midiChanges: [
        DDBEnricherData.generateOverrideChange("1", 20, "flags.midi-qol.fail.spell.all"),
      ],
    },
    "Fly": {
      changes: [
        DDBEnricherData.generateUpgradeChange("60", 20, "system.attributes.movement.fly"),
      ],
    },
    "Haste": {
      changes: [
        DDBEnricherData.generateSignedAddChange("2", 20, "system.attributes.ac.bonus"),
      ],
      midiChanges: [
        DDBEnricherData.generateOverrideChange("1", 20, "flags.midi-qol.advantage.ability.save.dex"),
        DDBEnricherData.generateCustomChange("*2", 30, "system.attributes.movement.all"),
      ],
    },
    "Invisibility": {
      noCreate: true,
      data: {
        "flags.dae.specialDuration": ["1Attack", "1Spell"],
      },
    },
    "Jallarzi's Storm of Radiance": {
      clearAutoEffects: true,
      name: "Within Storm of Radiance",
      statuses: ["Blinded", "Deafened"],
      options: {
        description: "You are unable to cast spells with the verbal component",
      },
    },
    "Mage Armor": {
      changes: [
        DDBEnricherData.generateOverrideChange("mage", 5, "system.attributes.ac.calc"),
      ],
    },
    "Mirror Image": {
      tokenMagicChanges: [
        DDBEnricherData.generateTokenMagicFXChange("images"),
      ],
    },
    "Mind Blank": {
      changes: [
        DDBEnricherData.generateUnsignedAddChange("psychic", 20, "system.traits.di.value"),
      ],
    },
    "Pass Without Trace": {
      changes: [
        DDBEnricherData.generateSignedAddChange("10", 20, "system.skills.ste.bonuses.check"),
      ],
    },
    "Protection from Poison": {
      changes: [
        DDBEnricherData.generateUnsignedAddChange("poison", 20, "system.traits.dr.value"),
      ],
    },
    "Shield": {
      changes: [
        DDBEnricherData.generateSignedAddChange("5", 20, "system.attributes.ac.bonus"),
      ],
      tokenMagicChanges: [
        DDBEnricherData.generateTokenMagicFXChange("water-field"),
      ],
      data: {
        "flags.dae.specialDuration": ["turnStart"],
      },
    },
    "Shield of Faith": {
      changes: [
        DDBEnricherData.generateSignedAddChange("5", 20, "system.attributes.ac.bonus"),
      ],
      tokenMagicChanges: [
        DDBEnricherData.generateTokenMagicFXChange("bloom"),
      ],
    },
    "Shining Smite": {
      name: "Shedding Light",
      atlChanges: [
        DDBEnricherData.generateATLChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '5'),
        DDBEnricherData.generateATLChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#ffffff'),
        DDBEnricherData.generateATLChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.25'),
        DDBEnricherData.generateATLChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '{"type": "pulse", "speed": 3,"intensity": 1}'),
      ],
    },
    "Slow": {
      changes: [
        DDBEnricherData.generateSignedAddChange("-2", 20, "system.attributes.ac.bonus"),
        DDBEnricherData.generateSignedAddChange("-2", 20, "system.abilities.dex.bonuses.save"),
      ],
      midiChanges: [
        DDBEnricherData.generateCustomChange("/2", 20, "system.attributes.movement.all"),
      ],
    },
    "Stoneskin": {
      changes: [
        DDBEnricherData.generateUnsignedAddChange("bludgeoning", 0, "system.traits.dr.value"),
        DDBEnricherData.generateUnsignedAddChange("piercing", 0, "system.traits.dr.value"),
        DDBEnricherData.generateUnsignedAddChange("slashing", 0, "system.traits.dr.value"),
        // {
        //   key: "system.traits.dr.bypass",
        //   value: "mgc",
        //   mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        //   priority: 0,
        // },
      ],
    },
    "Tasha's Caustic Brew": {
      name: "Covered in Acid",
      options: {
        description: "You are covered in acid. Take 2d4 &Reference[acid] damage at start of each of your turns until you use an action to scrape it off.",
      },
    },
    "Warding Bond": () => {
      const damageChanges = DDBEnricherData.allDamageTypes().map((type) => {
        return DDBEnricherData.generateUnsignedAddChange(type, 0, "system.traits.dr.value");
      });
      return {
        changes: [
          ...damageChanges,
          DDBEnricherData.generateSignedAddChange("1", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.generateSignedAddChange("1", 20, "system.bonuses.abilities.save"),
        ],
      };
    },
  };

}
