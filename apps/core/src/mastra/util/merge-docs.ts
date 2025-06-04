import fs from 'fs';
import path from 'path';
import {
  Project,
  InterfaceDeclaration,
  PropertySignature,
  SourceFile,
  type OptionalKind,
  type JSDocStructure,
} from 'ts-morph';
import { type MergeDocsRequestProps } from './types.js';
import { kebabToTitleCase } from './helpers.js';
import { label } from 'mastra';
import { MergeAgent } from '../agents/docs-merger/index.js';

// only available when merge-docs script has been ran
// const mergedAwsDocs = path.join(gitRoot, 'data', 'reference', 'merged', 'provider-aws');

export class MergeDocs {
  /**
   * Create a new MergeDocs instance from the given paths
   * @param declarationPath - Path to the declaration file
   * @param markdownPath - Path to the markdown file
   * @returns A new MergeDocs instance
   * @throws Error if the declarationPath or markdownPath does not exist
   */
  public static fromProps({ declarationPath, markdownPath }: MergeDocsRequestProps): MergeDocs {
    // if declarationPath or markdownPath does not exist, throw an error
    if (!fs.existsSync(declarationPath)) {
      throw new Error(`Declaration path does not exist: ${declarationPath}`);
    }
    if (!fs.existsSync(markdownPath)) {
      throw new Error(`Markdown path does not exist: ${markdownPath}`);
    }
    // read the declaration file
    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(declarationPath);
    // read the markdown file
    const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
    return new MergeDocs(declarationPath, markdownPath, sourceFile, markdownContent);
  }

  /**
   * For Unit Tests
   */
  public static fromContent(declarationContent: string, markdownContent: string) {
    const project = new Project();
    const sourceFile = project.createSourceFile('temp.d.ts', declarationContent);
    const declarationPath = path.join('temp', 'index.d.ts');
    const markdownPath = 'temp.html.markdown';
    return new MergeDocs(declarationPath, markdownPath, sourceFile, markdownContent);
  }

  /**
   * Return the full text of the current declaration file
   */
  public get fullText(): string {
    return this.sourceFile.getFullText();
  }
  private readonly _warnings: string[] = [];
  /**
   * Return any warnings that were generated during processing
   */
  public get warnings(): string[] {
    return this._warnings;
  }

  private constructor(
    private readonly declarationPath: string,
    private readonly markdownPath: string,
    private readonly sourceFile: SourceFile,
    private readonly markdownContent: string,
  ) {}

  /**
   * Process the markdown file and update the declaration file using LLM
   * This method uses Mastra to label the properties based on the markdown content
   */

  public async llmProcess(): Promise<MergeDocs> {
    const resourceType = path.basename(path.dirname(this.declarationPath));
    const configInterfaceName = `${kebabToTitleCase(resourceType)}Config`;
    const interfaces = this.sourceFile.getInterfaces();
    const configInterface = interfaces.find(intf => intf.getName() === configInterfaceName);

    if (!configInterface) {
      console.warn(`No ${configInterfaceName} interface found in ${this.declarationPath}`);
      return this;
    }

    const properties = configInterface.getProperties();
    if (properties.length === 0) {
      console.warn(`No properties found in interface ${configInterfaceName}`);
      return this;
    }

    const inputData = properties.map(prop => ({
      name: prop.getName(),
      existingDoc: prop.getJsDocs()?.[0]?.getText() || '',
    }));

    const agent = new MergeAgent();
    const labeled = await agent.labelProperties({
      properties: inputData,
      markdownContent: this.markdownContent,
    });

    if (labeled.length !== properties.length) {
      console.warn(`Mismatch between labeled docs and properties in ${configInterfaceName}`);
    }

    for (let i = 0; i < properties.length; i++) {
      const prop = properties[i];
      const description = labeled[i]?.description;

      if (!description) continue;

      prop.getJsDocs().forEach(jsDoc => jsDoc.remove());
      prop.addJsDoc({ description });
    }

    return this;
  }

  /**
   * Process the markdown file and update the declaration file
   */
  public process(): MergeDocs {
    // Find the main Config interface for the resource type
    const resourceType = path.basename(path.dirname(this.declarationPath));
    const configInterfaceName = `${kebabToTitleCase(resourceType)}Config`;
    const interfaces = this.sourceFile.getInterfaces();
    const configInterface = interfaces.find(intf => intf.getName() === configInterfaceName);

    if (!configInterface) {
      console.warn(`No ${configInterfaceName} interface found in ${this.declarationPath}`);
      return this;
    }

    const sections = this.parseMarkdown();
    const argsSection = sections.find(section => section.title === 'Argument Reference');

    if (!argsSection) {
      throw new Error(`No 'Argument Reference' section found in ${this.markdownPath}`);
    }

    // Map the markdown items to interface properties
    const rootArgs = argsSection.items.filter(i => !i.parentBlock);
    updateInterfaceJSDoc(configInterface, rootArgs);

    // Find and update nested block interfaces
    for (const item of argsSection.items) {
      if (item.isNestedBlock) {
        const nestedType = item.name[0]!.toUpperCase() + item.name.slice(1);
        const nestedInterface = interfaces.find(intf => intf.getName().endsWith(nestedType));

        if (!nestedInterface) {
          this._warnings.push(`No nested interface found for ${nestedType}`);
          continue;
        }

        // filter argSection items by parentBlock
        const nestedArgs = argsSection.items.filter(i => i.parentBlock === item.name);
        if (nestedArgs.length === 0) {
          this._warnings.push(`No nested args found for nested struct - ${item.name}`);
          continue;
        }
        updateInterfaceJSDoc(nestedInterface, nestedArgs);
      }
    }
    return this;
  }

  /**
   * Write the updated declaration file to disk
   */
  public writeTo(outputFilePath: string): void {
    // Ensure output directory exists
    const outputFileDir = path.dirname(outputFilePath);
    fs.mkdirSync(outputFileDir, { recursive: true });

    fs.writeFileSync(outputFilePath, this.sourceFile.getFullText());
  }

  /**
   * Parse the markdown into Doc Sections
   */
  private parseMarkdown(): DocSection[] {
    // TODO: Adopt unified and remark to parse markdown
    // let ast = unified().use(remarkParse).parse(this.markdownContent);

    const sections: DocSection[] = [];

    // Split content into sections based on ## headers
    const sectionRegex = /^## (.+)$/gm;
    const sectionMatches = this.markdownContent.split(sectionRegex);

    // Skip the first element which is content before the first section
    for (let i = 1; i < sectionMatches.length; i += 2) {
      const title = sectionMatches[i]!.trim();
      const content = sectionMatches[i + 1] || '';

      // extract list items
      const items = parseListItems(content);
      sections.push({ title, content, items, subSections: [] });
    }

    return sections;
  }
}

// Update JSDoc for interface properties
function updateInterfaceJSDoc(interfaceDecl: InterfaceDeclaration, items: ListItem[]) {
  const properties = interfaceDecl.getProperties();

  for (const item of items) {
    const tsPropertyName = item.name; //toTsPropertyName(item.name);
    const property = properties.find(prop => prop.getName() === tsPropertyName);

    if (property) {
      updatePropertyJSDoc(property, item);
    } else {
      console.warn(`Property '${tsPropertyName}' not found in interface '${interfaceDecl.getName()}'`);
    }
  }
}

// Update JSDoc for a specific property
function updatePropertyJSDoc(property: PropertySignature, item: ListItem) {
  const existingJsDoc = property.getJsDocs()[0];

  let description = item.description;
  if (item.condition) {
    description += `\n\nWhen ${item.condition}`;
  }
  // If there's an existing JSDoc, check if it already has a description
  if (existingJsDoc) {
    const tags = existingJsDoc.getTags();

    // Only update if there's no meaningful description
    const existingDescription = existingJsDoc.getDescription().trim();
    if (existingDescription && !existingDescription.includes('Docs at Terraform Registry')) {
      return; // Already has a meaningful description
    }

    // Create new JSDoc with our description and preserve existing tags
    const newJsDoc: OptionalKind<JSDocStructure> = {
      description,
      tags: tags.map(tag => {
        return {
          tagName: tag.getTagName(),
          text: tag.getText(),
        };
      }),
    };
    existingJsDoc.remove();
    property.addJsDoc(newJsDoc);
  } else {
    // No existing JSDoc, add a new one
    property.addJsDoc({
      description,
    });
  }
}

interface DocSection {
  title: string;
  content: string;
  items: ListItem[];
  subSections: { title: string; content: string }[];
}

interface ListItem {
  name: string;
  description: string;
  isNestedBlock?: boolean;
  parentBlock?: string;
  condition?: string;
}

// Parse list items from a section content
function parseListItems(content: string): ListItem[] {
  const items: ListItem[] = [];
  const lines = content.split('\n');

  let currentItem: Partial<ListItem> | null = null;
  let currentDescription: string[] = [];
  let currentParentBlock: string | undefined = undefined;
  let nextParentBlock: string | undefined = undefined;
  let currentCondition: string | undefined = undefined;
  let nextCondition: string | undefined = undefined;

  for (const line of lines) {
    // Check type of line
    const listItemMatch = line.match(/^\s*\*\s*`([^`]+)`\s*-\s*(.*)$/);
    const nestedBlockMatch = line.match(/^\s*Nested\s*`([^`]+)`.*$/);
    const whenBlockMatch = line.match(/^\s*When\s*`([^`]+)`\s*is\s*"([^"]+)".*$/);

    const headerBlockMatch = line.match(/^###\s+(.+)$/);
    if (headerBlockMatch) {
      const blockName = headerBlockMatch[1]!.trim().toLowerCase();
      // Check if this block name exists as a nested block in our existing items
      const existingBlock = items.find(item => item.isNestedBlock && item.name.toLowerCase() === blockName);
      if (existingBlock) {
        nextParentBlock = blockName;
        currentCondition = undefined;
        continue;
      }
    }
    const headerBlockMatch2 = line.match(/^`(.+)`.*support the following/);
    if (headerBlockMatch2) {
      const blockName = headerBlockMatch2[1]!.trim().toLowerCase();
      // Check if this block name exists as a nested block in our existing items
      const existingBlock = items.find(item => item.isNestedBlock && item.name.toLowerCase() === blockName);
      if (existingBlock) {
        nextParentBlock = blockName;
        currentCondition = undefined;
        continue;
      }
    }

    if (nestedBlockMatch) {
      // set parent block for next items
      nextParentBlock = nestedBlockMatch[1]!.trim();
      currentCondition = undefined;
    } else if (whenBlockMatch) {
      // set condition for next items
      nextCondition = whenBlockMatch[1]!.trim() + ' = "' + whenBlockMatch[2]!.trim() + '"';
    } else if (listItemMatch) {
      // Save previous item if exists
      if (currentItem && currentItem.name) {
        const description = currentDescription.join(' ').trim();
        const isNestedBlock =
          description.includes('The structure of this block is described below') ||
          description.includes('Specified below') ||
          description.includes('Documented below');
        items.push({
          name: currentItem.name,
          description,
          isNestedBlock,
          parentBlock: currentParentBlock,
          condition: currentCondition,
        });
        if (nextParentBlock) {
          currentParentBlock = nextParentBlock;
          nextParentBlock = undefined;
        }
        if (nextCondition) {
          currentCondition = nextCondition;
          nextCondition = undefined;
        }
      }

      // Start new item
      currentItem = { name: listItemMatch[1]!.trim() };
      currentDescription = [listItemMatch[2]!.trim()];
    }
    // If not a new item, append to current description if we're in an item
    else if (currentItem && line.trim()) {
      currentDescription.push(line.trim());
    }
  }

  // Don't forget to add the last item
  if (currentItem && currentItem.name) {
    const description = currentDescription.join(' ').trim();
    const isNestedBlock =
      description.includes('The structure of this block is described below') ||
      description.includes('Specified below') ||
      description.includes('Documented below');
    items.push({
      name: currentItem.name,
      description,
      isNestedBlock,
      parentBlock: currentParentBlock,
      condition: currentCondition,
    });
  }

  return items;
}
