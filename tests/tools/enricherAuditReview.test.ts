import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  artifactPathForFinding,
  buildSourceCatalog,
  decorateFinding,
  domainConfig,
  expectedBarrelPaths,
  filterFindings,
  groupFindings,
  manifestPathForFinding,
  parseReviewArgs,
  renderStarter,
  restoreSnapshot,
  snapshotFiles,
  updateDecisionManifest,
  updateSuppressionManifest,
  validateEditedProposal,
  validationTargets,
} from "../../tools/enricher-audit-review-lib.mjs";

function finding(overrides: Record<string, any> = {}): any {
  return {
    id: "description-audit:missing-healing:class:artificer:arcane-jolt:action:arcane-jolt:body",
    rule: "missing-healing",
    confidence: "high",
    domain: "class",
    namespace: "artificer",
    featureName: "Arcane Jolt",
    sourceKind: "action",
    sourceName: "Arcane Jolt",
    featureText: "Choose one of two outcomes.",
    sourceText: "A creature regains 2d6 Hit Points.",
    classNames: ["Artificer"],
    subclassNames: ["Battle Smith"],
    speciesNames: [],
    sourceIds: [191],
    suggestedEnricherPath: "class/artificer/ArcaneJolt.ts",
    suggestedEnricherClass: "ArcaneJolt",
    clauseLabel: "Restorative Energy",
    evidence: "A creature regains 2d6 Hit Points.",
    expected: "healing activity",
    actual: "damage activity",
    enricher: "Generic",
    decision: "todo",
    suppressed: false,
    suppressionReason: null,
    stubs: ["one.json"],
    sourceBooks: [{ id: 191, name: "EFotA", description: "Eberron: Forge of the Artificer", categoryId: 38, categoryName: "Eberron" }],
    sourceCategories: [{ id: 38, name: "Eberron" }],
    ...overrides,
  };
}

describe("review argument and source handling", () => {
  it("parses repeatable and comma-separated filters", () => {
    expect(parseReviewArgs([
      "--confidence", "high,medium",
      "--domain", "class",
      "--class", "Artificer",
      "--class", "Wizard",
      "--source-category", "Eberron",
      "--no-refresh",
    ])).toMatchObject({
      confidence: ["high", "medium"],
      domains: ["class"],
      classes: ["Artificer", "Wizard"],
      sourceCategories: ["Eberron"],
      refresh: false,
    });
  });

  it("rejects a flag used where a value belongs instead of swallowing it", () => {
    expect(() => parseReviewArgs(["--class", "--refresh"])).toThrow(/--class requires a value/);
    expect(() => parseReviewArgs(["--class", "Artificer", "--editor"])).toThrow(/--editor requires a value/);
    // a value that merely follows another flag is still fine
    expect(parseReviewArgs(["--class", "Artificer", "--refresh"])).toMatchObject({
      classes: ["Artificer"],
      refresh: true,
    });
  });

  it("decorates source ids using fallback-config-shaped data", () => {
    const catalog = buildSourceCatalog({
      sourceCategories: [{ id: 38, name: "Eberron" }],
      sources: [{ id: 191, name: "EFotA", description: "Forge", sourceCategoryId: 38 }],
    });
    expect(decorateFinding(finding({ sourceBooks: undefined, sourceCategories: undefined }), catalog)).toMatchObject({
      sourceBooks: [{ id: 191, name: "EFotA", description: "Forge", categoryName: "Eberron" }],
      sourceCategories: [{ id: 38, name: "Eberron" }],
    });
  });
});

describe("finding filters and grouping", () => {
  const filters = {
    confidence: ["high"],
    domains: ["class"],
    classes: ["Artificer", "Wizard"],
    subclasses: ["Battle Smith"],
    species: [],
    sources: ["EFotA"],
    sourceCategories: ["Eberron"],
  };

  it("uses OR within a filter and AND between filters", () => {
    const accepted = finding();
    const wrongSubclass = finding({ id: "wrong-subclass", subclassNames: ["Alchemist"] });
    const wrongSource = finding({ id: "wrong-source", sourceBooks: [{ id: 1, name: "PHB", description: "Player's Handbook", categoryId: 1, categoryName: "Core" }] });
    const suppressed = finding({ id: "suppressed", suppressed: true });
    expect(filterFindings([accepted, wrongSubclass, wrongSource, suppressed], filters).map((entry: any) => entry.id)).toEqual([accepted.id]);
  });

  it("groups every finding that resolves to the same enricher", () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), "audit-review-group-"));
    try {
      const second = finding({ id: "second", rule: "missing-save" });
      const groups = groupFindings([finding(), second], repo);
      expect(groups).toHaveLength(1);
      expect(groups[0].findings).toHaveLength(2);
      expect(groups[0].targetRelative).toBe("class/artificer/ArcaneJolt.ts");
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });
});

describe("domain routing", () => {
  it("routes each domain to its enricher subtree, manifest and artifact", () => {
    const feat = finding({ domain: "feat", namespace: "feats" });
    const species = finding({ domain: "species", namespace: "Dragonborn" });

    expect(domainConfig("class").enricherDir).toBe("class");
    expect(domainConfig("species").enricherDir).toBe("trait");

    expect(manifestPathForFinding(finding(), "/repo")).toBe("/repo/tests/audit/artificer.decisions.json");
    expect(manifestPathForFinding(feat, "/repo")).toBe("/repo/tests/audit/feats.decisions.json");
    expect(manifestPathForFinding(species, "/repo")).toBe("/repo/tests/audit/species.decisions.json");

    expect(artifactPathForFinding(finding(), "/repo")).toBe("/repo/audit-output/artificer.description-audit.json");
    expect(artifactPathForFinding(species, "/repo")).toBe("/repo/audit-output/species.description-audit.json");
  });

  it("refuses an unrecognised domain rather than defaulting to feat", () => {
    expect(() => domainConfig("monster")).toThrow(/Unknown audit domain: monster/);
  });

  it("splits a group into one validation target per audit suite", () => {
    const sameSuite = finding({ id: "second" });
    const otherClass = finding({ id: "third", namespace: "wizard" });
    const targets = validationTargets([finding(), sameSuite, otherClass]);
    expect(targets).toHaveLength(2);
    expect(targets.map((target: any) => target.findings.length)).toEqual([2, 1]);
    expect(targets[1].finding.namespace).toBe("wizard");
  });
});

describe("proposal and transaction helpers", () => {
  it("requires an edited, TODO-free correctly named class", () => {
    const starter = renderStarter("class/artificer/ArcaneJolt.ts", [finding()]);
    expect(validateEditedProposal(starter, starter, "ArcaneJolt")).toContain("The editor did not change the proposal.");
    expect(validateEditedProposal(starter, starter.replaceAll("TODO", "DONE"), "ArcaneJolt")).toEqual([]);
    expect(validateEditedProposal(starter, starter.replaceAll("TODO", "DONE").replace("class ArcaneJolt", "class Wrong"), "ArcaneJolt"))
      .toContain("The default class must be named ArcaneJolt.");
  });

  it("derives the DDBEnricherData import from the target's depth", () => {
    expect(renderStarter("feat/Alert.ts", [finding()]))
      .toContain('import DDBEnricherData from "../data/DDBEnricherData";');
    expect(renderStarter("class/artificer/ArcaneJolt.ts", [finding()]))
      .toContain('import DDBEnricherData from "../../data/DDBEnricherData";');
    expect(renderStarter("trait/dragonborn/BreathWeapon.ts", [finding()]))
      .toContain('import DDBEnricherData from "../../data/DDBEnricherData";');
  });

  it("scaffolds effects for effect rules and activities for the rest", () => {
    const activities = renderStarter("class/artificer/ArcaneJolt.ts", [finding()]);
    expect(activities).toContain("get additionalActivities(): IDDBAdditionalActivity[]");
    expect(activities).not.toContain("get effects()");

    const effects = renderStarter("class/artificer/ArcaneJolt.ts", [finding({ rule: "missing-passive-effect" })]);
    expect(effects).toContain("get effects(): IDDBEffectHint[]");
    expect(effects).not.toContain("get additionalActivities()");

    const both = renderStarter("class/artificer/ArcaneJolt.ts", [finding(), finding({ rule: "missing-condition-effect" })]);
    expect(both).toContain("get additionalActivities(): IDDBAdditionalActivity[]");
    expect(both).toContain("get effects(): IDDBEffectHint[]");
  });

  it("updates only selected decision entries and preserves existing fields", () => {
    const updated = JSON.parse(updateDecisionManifest({
      content: `${JSON.stringify({ "Arcane Jolt": { decision: "todo", descriptionAudit: { suppressions: { old: "reason" } } } })}\n`,
      featureNames: ["Arcane Jolt"],
      decision: "override",
      enricher: "ArcaneJolt",
      note: "Reviewed interactively.",
    }));
    expect(updated["Arcane Jolt"]).toEqual({
      decision: "override",
      enricher: "ArcaneJolt",
      notes: "Reviewed interactively.",
      descriptionAudit: { suppressions: { old: "reason" } },
    });
  });

  it("adds stable permanent-ignore ids without changing the triage decision", () => {
    const updated = JSON.parse(updateSuppressionManifest({
      content: `${JSON.stringify({ "Arcane Jolt": { decision: "keep-default", notes: "Existing note" } })}\n`,
      findings: [finding()],
      reason: "Handled by the earlier leveled activity.",
    }));
    expect(updated["Arcane Jolt"]).toEqual({
      decision: "keep-default",
      notes: "Existing note",
      descriptionAudit: {
        suppressions: {
          [finding().id]: "Handled by the earlier leveled activity.",
        },
      },
    });
    expect(() => updateSuppressionManifest({ content: "{}", findings: [finding()], reason: "" })).toThrow(/reason/);
  });

  it("restores only snapshotted files", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "audit-review-rollback-"));
    const target = path.join(root, "target.ts");
    const barrel = path.join(root, "_module.ts");
    const unrelated = path.join(root, "unrelated.ts");
    try {
      fs.writeFileSync(target, "before target");
      fs.writeFileSync(barrel, "before barrel");
      fs.writeFileSync(unrelated, "before unrelated");
      const snapshot = snapshotFiles([target, barrel]);
      fs.writeFileSync(target, "after target");
      fs.writeFileSync(barrel, "after barrel");
      fs.writeFileSync(unrelated, "user edit");
      restoreSnapshot(snapshot);
      expect(fs.readFileSync(target, "utf8")).toBe("before target");
      expect(fs.readFileSync(barrel, "utf8")).toBe("before barrel");
      expect(fs.readFileSync(unrelated, "utf8")).toBe("user edit");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("identifies the leaf and parent barrels for nested enrichers", () => {
    expect(expectedBarrelPaths("class/artificer/ArcaneJolt.ts", "/repo")).toEqual([
      "/repo/src/parser/enrichers/class/artificer/_module.ts",
      "/repo/src/parser/enrichers/class/_module.ts",
    ]);
  });
});

describe("review CLI", () => {
  it("parses help without requiring interactive options", () => {
    expect(parseReviewArgs(["--help"])).toMatchObject({ help: true, refresh: null });
  });
});
