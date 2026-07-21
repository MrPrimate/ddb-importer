export {

};

global {
  interface IUpdateItemIndex extends Collection<CompendiumCollection.IndexEntry<"Item">> {
    name?: string;
    type?: string;
    flags?: {
      ddbimporter?: {
        definitionId?: number;
        definitionEntityTypeId?: number;
      };
    };
  }
}
