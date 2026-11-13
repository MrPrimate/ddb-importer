// Release-build-only crash guard. When a class has a private instance `#method` whose body names
// the class (`DDBMuncher.#emptyImportMessage(...)` inside a `#method`), tsc rewrites every self-reference inside the
// class to a hoisted alias (`var _a; class X { ... } _a = X;`) that is only assigned AFTER the
// class body. A static field initializer that names the class, such as
// `static DEFAULT_OPTIONS = { actions: { x: X.x } }`, then reads `_a` while it is still undefined
// and the module dies on load ("can't access property parseSpells, R is undefined").
//
// The esbuild dev build and the vitest transform emit a safe inner alias instead, so nothing
// else in the test suite sees it: only `npm run build` (webpack + ts-loader, transpileOnly)
// produces the broken shape. This test reproduces that emit with ts.transpileModule and the
// project tsconfig, then flags any static initializer that reads such an alias.
//
// The fix in source is `this.x` instead of `ClassName.x` inside static initializers.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = path.resolve(import.meta.dirname, "../..");
const SRC = path.join(ROOT, "src");

/**
 * The compiler options ts-loader uses for the release build: tsconfig.json as written.
 * @returns {ts.CompilerOptions} Parsed options.
 */
function releaseCompilerOptions(): ts.CompilerOptions {
  const configPath = path.join(ROOT, "tsconfig.json");
  const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);
  if (error) throw new Error(ts.flattenDiagnosticMessageText(error.messageText, "\n"));
  return ts.convertCompilerOptionsFromJson(config.compilerOptions, ROOT, configPath).options;
}

/**
 * Every non-declaration .ts file under a directory.
 * @param {string} dir  Directory to walk.
 * @returns {string[]}  Absolute file paths.
 */
function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts") ? [full] : [];
  });
}

/**
 * Names assigned a class after its body in emitted code: `_a = ClassName;` at statement level,
 * which is how tsc publishes its deferred self-reference alias.
 * @param {ts.SourceFile} file  Emitted JavaScript.
 * @returns {Map<string, string>}  Alias name to the class it aliases.
 */
function deferredClassAliases(file: ts.SourceFile): Map<string, string> {
  const classNames = new Set<string>();
  const aliases = new Map<string, string>();
  const visit = (node: ts.Node) => {
    if ((ts.isClassDeclaration(node) || ts.isClassExpression(node)) && node.name) classNames.add(node.name.text);
    if (
      ts.isExpressionStatement(node)
      && ts.isBinaryExpression(node.expression)
      && node.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken
      && ts.isIdentifier(node.expression.left)
      && ts.isIdentifier(node.expression.right)
    ) {
      aliases.set(node.expression.left.text, node.expression.right.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return new Map([...aliases].filter(([, target]) => classNames.has(target)));
}

/**
 * Static property initializers in emitted code that read a deferred class alias.
 * @param {string} fileName  Source path, for the report.
 * @param {string} js        Emitted JavaScript.
 * @returns {string[]}       One `file:line: ClassName.prop reads alias` entry per hit.
 */
function aliasReadsInStaticInitializers(fileName: string, js: string): string[] {
  const file = ts.createSourceFile(fileName, js, ts.ScriptTarget.ES2022, true);
  const aliases = deferredClassAliases(file);
  if (aliases.size === 0) return [];

  const hits: string[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isPropertyDeclaration(node)
      && node.initializer
      && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword)
    ) {
      const owner = (node.parent as ts.ClassLikeDeclaration).name?.text ?? "<anonymous>";
      const scan = (inner: ts.Node) => {
        // a function body runs later, after the alias is assigned
        if (ts.isFunctionLike(inner)) return;
        if (ts.isIdentifier(inner) && aliases.has(inner.text)) {
          const { line } = file.getLineAndCharacterOfPosition(inner.getStart());
          hits.push(`${path.relative(ROOT, fileName)}:${line + 1}: ${owner}.${node.name.getText()} reads ${inner.text} (${aliases.get(inner.text)})`);
        }
        ts.forEachChild(inner, scan);
      };
      scan(node.initializer);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return hits;
}

/**
 * Transpile one TypeScript source the way ts-loader does and report alias reads.
 * @param {string} fileName  Path used in the report.
 * @param {string} source    TypeScript source.
 * @param {ts.CompilerOptions} options  Compiler options.
 * @returns {string[]}       Hits, empty when safe.
 */
function scanSource(fileName: string, source: string, options: ts.CompilerOptions): string[] {
  const { outputText } = ts.transpileModule(source, { compilerOptions: options, fileName });
  return aliasReadsInStaticInitializers(fileName, outputText);
}

describe("release-build static initializer class alias", () => {
  const options = releaseCompilerOptions();

  it("detects the broken shape", () => {
    const source = [
      "export default class Muncher {",
      "  static DEFAULT_OPTIONS = { actions: { parse: Muncher.parse } };",
      "  static parse() { return 1; }",
      "  #message() { return Muncher.DEFAULT_OPTIONS; }",
      "}",
    ].join("\n");
    expect(scanSource(path.join(SRC, "Fake.ts"), source, options)).toHaveLength(1);

    const fixed = source.replace("parse: Muncher.parse", "parse: this.parse");
    expect(scanSource(path.join(SRC, "Fake.ts"), fixed, options)).toEqual([]);
  });

  it("finds no static initializer reading a deferred class alias in src", () => {
    const hits = sourceFiles(SRC).flatMap((file) => {
      const source = fs.readFileSync(file, "utf8");
      // the alias only appears with a private member and a static field; skip the rest cheaply
      if (!source.includes("#") || !(/\bstatic\b/).test(source)) return [];
      return scanSource(file, source, options);
    });
    // use `this.x` rather than `ClassName.x` in these static initializers
    expect(hits).toEqual([]);
  });
});
