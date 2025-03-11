/**
 * Properties for looking up an existing Key with Terraform data source.
 */
export interface KeyLookupOptions {
    /**
     * The alias name of the Key
     *
     * Must be in the format `alias/<AliasName>`.
     */
    readonly aliasName: string;
}
