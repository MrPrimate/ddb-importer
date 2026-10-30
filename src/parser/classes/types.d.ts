export {};

global {
  interface IDDBFixFunctionArgs {
    newName?: string | null;
    identifier?: string | null;
    /** extra level entries for AdvancementHelper.addScaleEntries, keyed by level */
    scale?: Record<string, I5eAdvScaleValueEntry>;
  }
  type TDDBFixFunction = (advancement: I5eAdvancement, args?: IDDBFixFunctionArgs) => I5eAdvancement;
  type TDDBScaleValueFixFunction = (advancement: I5eAdvancementScaleValue) => I5eAdvancement;
  type TDDBClassSpecialAdvancements = Record<string, {
    fix: boolean;
    fixFunction?: TDDBFixFunction;
    functionArgs?: IDDBFixFunctionArgs;
    additionalAdvancements?: boolean;
    additionalFunctions?: TDDBScaleValueFixFunction[];
    fixFunctions?: { fn: TDDBFixFunction; args?: IDDBFixFunctionArgs }[];
    /** advancements to add when the feature is on the class but DDB gives it no level scale */
    withoutScaleFunctions?: (() => I5eAdvancement)[];
  }>;

  interface IDBClassPendingClassDocument {
    data: I5eClassItem;
    isSubClass?: boolean;
    className: string;
    name: string;
    versionStub: string;
    /** advancements to write onto the compendium documents of the class's own features */
    featureAdvancements?: IDDBFeatureAdvancementPatch[];
  }

  interface IDDBClassOwnedFeatureAdvancements {
    feature: IDDBClassDefinitionFeature;
    advancements: I5eAdvancement[];
  }

  interface IDDBFeatureAdvancementPatch {
    uuid: string;
    advancements: I5eAdvancement[];
    /**
     * Who wrote the advancements. They are tagged with it, and the owner's earlier advancements on
     * the document that this patch no longer carries are deleted.
     */
    owner?: string;
    /** Ids of advancements to delete from the document, e.g. ones that have moved elsewhere. */
    remove?: string[];
  }

}
