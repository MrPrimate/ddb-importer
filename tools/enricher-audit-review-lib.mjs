/**
 * Helpers behind `npm run audit:review` (tools/review-enricher-findings.mjs).
 *
 * The interactive prompt, subprocess and console work all live in the CLI; this
 * module holds the decision logic — argument parsing, filtering, grouping,
 * scaffold rendering and the snapshot/restore transaction — so the review flow
 * can be exercised without a TTY. See tests/tools/enricherAuditReview.test.ts.
 *
 * Manifest writes land in tests/audit/*.decisions.json, which is a git
 * submodule: accepted decisions and permanent ignores need their own commit in
 * that repo.
 */

import fs from "node:fs";
import path from "node:path";

export const RULE_EXPLANATIONS = {
  "missing-damage": "The source describes a concrete damage outcome, but no matching damage-capable activity was generated.",
  "missing-healing": "The source describes hit-point recovery, but no matching healing activity was generated.",
  "missing-save": "The source asks for a saving throw, but no matching save activity was generated.",
  "missing-check": "The source asks for an ability check, but no matching check activity was generated.",
  "activation-mismatch": "The source names an action economy cost that differs from the generated activity activation.",
  "save-ability-mismatch": "The generated save activity uses a different ability from the source description.",
  "missing-consumption": "The source spends a resource, but the matched generated activity has no consumption target.",
  "range-mismatch": "The unambiguous range in the source differs from every matched generated activity range.",
  "missing-condition-effect": "The source applies a condition, but the generated item has no document or activity-linked effect.",
  "missing-passive-effect": "The source describes a passive mechanical benefit, but the generated item has no effect representing it.",
};

export function normaliseKey(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Everything that varies per content domain, in one place: the enricher
 * subtree, the decisions manifest, the audit-output artifact and the suite that
 * regenerates it. Adding a domain means adding an entry here.
 */
export const DOMAINS = {
  class: {
    enricherDir: "class",
    auditTest: "tests/audit/classes.audit.test.ts",
    // class suites are one describe block per class slug, so a targeted run
    // only has to rebuild the artifact for the namespace under review
    testNameFilter: (finding) => normaliseKey(finding.namespace),
    artifactSlug: (finding) => normaliseKey(finding.namespace),
    manifestFile: (finding) => `${normaliseKey(finding.namespace)}.decisions.json`,
  },
  feat: {
    enricherDir: "feat",
    auditTest: "tests/audit/feats.audit.test.ts",
    testNameFilter: () => null,
    artifactSlug: () => "feats",
    manifestFile: () => "feats.decisions.json",
  },
  species: {
    enricherDir: "trait",
    auditTest: "tests/audit/species.audit.test.ts",
    testNameFilter: () => null,
    artifactSlug: () => "species",
    manifestFile: () => "species.decisions.json",
  },
};

export const DOMAIN_NAMES = Object.keys(DOMAINS);

export function domainConfig(domain) {
  const config = DOMAINS[domain];
  if (!config) throw new Error(`Unknown audit domain: ${domain}`);
  return config;
}

function listValue(options, key, value) {
  options[key].push(...String(value).split(",").map((entry) => entry.trim()).filter(Boolean));
}

export function parseReviewArgs(argv) {
  const options = {
    confidence: [],
    domains: [],
    classes: [],
    subclasses: [],
    species: [],
    sources: [],
    sourceCategories: [],
    editor: null,
    refresh: null,
    help: false,
  };
  const listFlags = {
    "--confidence": "confidence",
    "--domain": "domains",
    "--class": "classes",
    "--subclass": "subclasses",
    "--species": "species",
    "--source": "sources",
    "--source-category": "sourceCategories",
  };
  // a bare `--class --refresh` must not silently consume the next flag as a value
  const takeValue = (argument, value) => {
    if (!value || value.startsWith("-")) throw new Error(`${argument} requires a value`);
    return value;
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--refresh") options.refresh = true;
    else if (argument === "--no-refresh") options.refresh = false;
    else if (["--help", "-h"].includes(argument)) options.help = true;
    else if (argument === "--editor") {
      options.editor = takeValue(argument, argv[index + 1]);
      index += 1;
    } else if (listFlags[argument]) {
      listValue(options, listFlags[argument], takeValue(argument, argv[index + 1]));
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (options.confidence.some((value) => !["high", "medium", "all"].includes(normaliseKey(value)))) {
    throw new Error("--confidence must be high, medium, or all");
  }
  if (options.domains.some((value) => ![...DOMAIN_NAMES, "all"].includes(normaliseKey(value)))) {
    throw new Error(`--domain must be ${DOMAIN_NAMES.join(", ")}, or all`);
  }
  return options;
}

export function buildSourceCatalog(config) {
  const categories = new Map((config.sourceCategories ?? []).map((category) => [Number(category.id), {
    id: Number(category.id),
    name: category.name,
  }]));
  const sources = new Map((config.sources ?? []).map((source) => [Number(source.id), {
    id: Number(source.id),
    name: source.name,
    description: source.description,
    categoryId: Number(source.sourceCategoryId),
    categoryName: categories.get(Number(source.sourceCategoryId))?.name ?? "Unknown",
  }]));
  return { categories, sources };
}

export function decorateFinding(finding, catalog) {
  const books = (finding.sourceIds ?? []).map((id) => catalog.sources.get(Number(id))).filter(Boolean);
  const sourceCategories = [...new Map(books.map((book) => [book.categoryId, {
    id: book.categoryId,
    name: book.categoryName,
  }])).values()];
  return { ...finding, sourceBooks: books, sourceCategories };
}

function matchesSelection(selected, candidates) {
  if (!selected?.length || selected.some((value) => normaliseKey(value) === "all")) return true;
  const keys = candidates.map(normaliseKey);
  return selected.some((selection) => keys.includes(normaliseKey(selection)));
}

export function filterFindings(findings, filters) {
  return findings.filter((finding) => {
    if (finding.suppressed) return false;
    if (!matchesSelection(filters.confidence, [finding.confidence])) return false;
    if (!matchesSelection(filters.domains, [finding.domain])) return false;
    if (!matchesSelection(filters.classes, finding.classNames ?? [])) return false;
    if (!matchesSelection(filters.subclasses, finding.subclassNames ?? [])) return false;
    if (!matchesSelection(filters.species, finding.speciesNames ?? [])) return false;
    const sourceCandidates = (finding.sourceBooks ?? []).flatMap((source) => [source.id, source.name, source.description]);
    if (!matchesSelection(filters.sources, sourceCandidates)) return false;
    const categoryCandidates = (finding.sourceCategories ?? []).flatMap((category) => [category.id, category.name]);
    return matchesSelection(filters.sourceCategories, categoryCandidates);
  });
}

function walkFiles(root, result = []) {
  if (!fs.existsSync(root)) return result;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) walkFiles(entryPath, result);
    else result.push(entryPath);
  }
  return result;
}

export function resolveTargetRelative(finding, repoRoot) {
  const enricherRoot = path.join(repoRoot, "src/parser/enrichers");
  const suggested = finding.suggestedEnricherPath;
  if (suggested && fs.existsSync(path.join(enricherRoot, suggested))) return suggested;
  if (finding.enricher && !["Generic", "(none)", "(unknown)"].includes(finding.enricher)) {
    const domainRoot = path.join(enricherRoot, domainConfig(finding.domain).enricherDir);
    const matches = walkFiles(domainRoot).filter((file) => path.basename(file) === `${finding.enricher}.ts`);
    if (matches.length === 1) return path.relative(enricherRoot, matches[0]).split(path.sep).join("/");
    const namespace = normaliseKey(finding.namespace);
    const contextual = matches.find((file) => normaliseKey(path.basename(path.dirname(file))) === namespace);
    if (contextual) return path.relative(enricherRoot, contextual).split(path.sep).join("/");
  }
  return suggested;
}

export function groupFindings(findings, repoRoot) {
  const groups = new Map();
  for (const finding of findings) {
    const targetRelative = resolveTargetRelative(finding, repoRoot);
    if (!targetRelative) continue;
    const existing = groups.get(targetRelative) ?? { targetRelative, findings: [] };
    existing.findings.push(finding);
    groups.set(targetRelative, existing);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    findings: group.findings.sort((a, b) => a.id.localeCompare(b.id)),
  })).sort((a, b) => a.targetRelative.localeCompare(b.targetRelative));
}

function commentText(value) {
  return String(value).replaceAll("*/", "* /").replaceAll(/\r?\n/g, " ");
}

/** Rules whose fix is an effect rather than an extra activity. */
const EFFECT_RULES = new Set(["missing-condition-effect", "missing-passive-effect"]);

export function renderStarter(targetRelative, findings) {
  const parts = targetRelative.replaceAll("\\", "/").split("/");
  const className = path.basename(targetRelative, ".ts");
  const dataImport = `${"../".repeat(parts.length - 1)}data/DDBEnricherData`;
  const wantsEffects = findings.some((finding) => EFFECT_RULES.has(finding.rule));
  const wantsActivities = !wantsEffects || findings.some((finding) => !EFFECT_RULES.has(finding.rule));

  const lines = [
    `import DDBEnricherData from "${dataImport}";`,
    "",
    "/**",
    " * Generated review scaffold. Resolve every TODO before installation.",
  ];
  for (const finding of findings) {
    lines.push(` * TODO [${finding.rule}] ${commentText(finding.expected)}`);
    lines.push(` * Evidence: ${commentText(finding.evidence)}`);
  }
  lines.push(" */");
  lines.push(`export default class ${className} extends DDBEnricherData {`);
  lines.push("");
  if (wantsActivities) {
    lines.push("  get useDefaultAdditionalActivities() {");
    lines.push("    return true;");
    lines.push("  }");
    lines.push("");
    lines.push("  get addToDefaultAdditionalActivities() {");
    lines.push("    return true;");
    lines.push("  }");
    lines.push("");
    lines.push("  get additionalActivities(): IDDBAdditionalActivity[] {");
    lines.push("    // TODO: implement the reviewed activity findings above.");
    lines.push("    return [];");
    lines.push("  }");
    lines.push("");
  }
  if (wantsEffects) {
    lines.push("  get effects(): IDDBEffectHint[] {");
    lines.push("    // TODO: implement the reviewed effect findings above.");
    lines.push("    return [];");
    lines.push("  }");
    lines.push("");
  }
  lines.push("}");
  lines.push("");
  return lines.join("\n");
}

export function validateEditedProposal(original, edited, expectedClassName) {
  const issues = [];
  if (edited === original) issues.push("The editor did not change the proposal.");
  if ((/\bTODO\b/).test(edited)) issues.push("The proposal still contains TODO markers.");
  const classMatch = edited.match(/export\s+default\s+class\s+([A-Za-z_$][\w$]*)/);
  if (!classMatch) issues.push("The proposal needs a default-exported class.");
  else if (classMatch[1] !== expectedClassName) issues.push(`The default class must be named ${expectedClassName}.`);
  return issues;
}

export function manifestPathForFinding(finding, repoRoot) {
  return path.join(repoRoot, "tests/audit", domainConfig(finding.domain).manifestFile(finding));
}

/** audit-output artifact that `domainConfig(domain).auditTest` regenerates. */
export function artifactPathForFinding(finding, repoRoot) {
  const slug = domainConfig(finding.domain).artifactSlug(finding);
  return path.join(repoRoot, "audit-output", `${slug}.description-audit.json`);
}

/**
 * Distinct audit suites a set of findings needs, keyed by domain and artifact
 * slug. Grouping is keyed on the enricher path alone, so a group can legitimately
 * span namespaces — validating only the first finding's suite would leave the
 * rest unchecked.
 */
export function validationTargets(findings) {
  const targets = new Map();
  for (const finding of findings) {
    const key = `${finding.domain}:${domainConfig(finding.domain).artifactSlug(finding)}`;
    const existing = targets.get(key) ?? { finding, findings: [] };
    existing.findings.push(finding);
    targets.set(key, existing);
  }
  return [...targets.values()];
}

export function updateDecisionManifest({ content, featureNames, decision, enricher, note }) {
  const manifest = content ? JSON.parse(content) : {};
  for (const featureName of featureNames) {
    const current = manifest[featureName] ?? { decision: "todo" };
    const notes = [current.notes, note].filter(Boolean);
    manifest[featureName] = {
      ...current,
      decision,
      enricher,
      ...(notes.length ? { notes: [...new Set(notes)].join(" ") } : {}),
    };
  }
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function updateSuppressionManifest({ content, findings, reason }) {
  if (typeof reason !== "string" || reason.trim().length < 4) {
    throw new Error("A permanent-ignore reason must contain at least four characters.");
  }
  const manifest = content ? JSON.parse(content) : {};
  for (const finding of findings) {
    const current = manifest[finding.featureName] ?? { decision: "todo" };
    manifest[finding.featureName] = {
      ...current,
      descriptionAudit: {
        ...current.descriptionAudit,
        suppressions: {
          ...current.descriptionAudit?.suppressions,
          [finding.id]: reason.trim(),
        },
      },
    };
  }
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function expectedBarrelPaths(targetRelative, repoRoot) {
  const enricherRoot = path.join(repoRoot, "src/parser/enrichers");
  const parts = targetRelative.split(/[\\/]/);
  const paths = [path.join(enricherRoot, ...parts.slice(0, -1), "_module.ts")];
  if (["class", "trait"].includes(parts[0])) paths.push(path.join(enricherRoot, parts[0], "_module.ts"));
  return [...new Set(paths)];
}

export function snapshotFiles(paths) {
  return new Map(paths.map((file) => [file, fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null]));
}

export function restoreSnapshot(snapshot) {
  for (const [file, content] of snapshot) {
    if (content === null) {
      if (fs.existsSync(file)) fs.rmSync(file, { force: true });
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
    }
  }
}

export function changedSnapshotPaths(snapshot) {
  const changed = [];
  for (const [file, content] of snapshot) {
    const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
    if (current !== content) changed.push(file);
  }
  return changed;
}

export function listBarrelFiles(repoRoot) {
  return walkFiles(path.join(repoRoot, "src/parser/enrichers"))
    .filter((file) => path.basename(file) === "_module.ts");
}
