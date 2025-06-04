import { label } from 'mastra';

export interface MergeAgentInput {
  properties: { name: string; existingDoc?: string }[];
  markdownContent: string;
}

export interface MergeAgentOutput {
  name: string;
  description: string;
}

export class MergeAgent {
  async labelProperties(input: MergeAgentInput): Promise<MergeAgentOutput[]> {
    const labeled = await label({
      items: input.properties,
      instructions: `
        You are a documentation assistant. Use the provided Markdown reference to document each TypeScript property.

        For each property:
        - Extract relevant descriptions from the Markdown content.
        - Write a concise and informative JSDoc-style comment.
        - If no relevant content is found, return an empty string.
        - Avoid fabricating information or restating the property name.

        ### Markdown Reference:
        ${input.markdownContent}
      `,
      labeler: async (item: { name: string; existingDoc?: string }) => ({
        name: item.name,
        description: `Provide a JSDoc-style description for the TypeScript property "${item.name}". Existing doc (if any): "${item.existingDoc ?? 'none'}"`,
      }),
    });

    return labeled.map((entry: { description: string }, index: number) => ({
      name: input.properties[index]?.name,
      description: entry.description?.trim() || '',
    }));
  }
}
