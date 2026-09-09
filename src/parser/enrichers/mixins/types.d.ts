export {};

global {

  interface IAdditionalActivityOutline {
    type: string;
    name: string;
    options: IDDBActivityBuild;
  }

  /** Arguments passed to an enricher's customFunction hook. */
  interface ICustomFunctionOptions {
    name?: string | null;
    activity?: IDDBActivityData | null;
  }

  type TIndexEntry = CompendiumCollection.IndexEntry<CompendiumCollection.DocumentName>;

}
