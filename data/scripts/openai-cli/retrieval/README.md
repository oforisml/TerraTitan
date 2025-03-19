# Retrieval

Hacky attempt(s) to control Token size for context window with some type of retrieval functionality.

## filterGeneratedModule

Function to filter AWS CDK lib `xxx.generated.d.ts` files down to what's imported in the inputFile using the Typescript AST.
