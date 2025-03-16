import fs from "fs";
import path from "path";
import glob from "glob";
import {
  Project,
  InterfaceDeclaration,
  PropertySignature,
  type OptionalKind,
  type JSDocStructure,
} from "ts-morph";

const inputMarkdownFiles = [
  "data/reference/docs/typescript/provider-aws/r/ami.html.markdown",
  "data/reference/docs/typescript/provider-aws/r/sns_topic_data_protection_policy.html.markdown",
  "data/reference/docs/typescript/provider-aws/r/sns_topic_policy.html.markdown",
  "data/reference/docs/typescript/provider-aws/r/sns_topic_subscription.html.markdown",
  "data/reference/docs/typescript/provider-aws/r/sns_topic.html.markdown",
];
const inputDeclarationFiles = [
  "data/reference/declarations/provider-aws/ami/index.d.ts",
  "data/reference/declarations/provider-aws/sns-topic-data-protection-policy/index.d.ts",
  "data/reference/declarations/provider-aws/sns-topic-policy/index.d.ts",
  "data/reference/declarations/provider-aws/sns-topic-subscription/index.d.ts",
  "data/reference/declarations/provider-aws/sns-topic/index.d.ts",
];
// Create output directory
const outputDir = path.resolve(process.cwd(), "data", "reference", "merged");

interface DocSection {
  title: string;
  content: string;
  items: ListItem[];
  subSections: { title: string; content: string }[];
}

// TODO: consider remark for markdown parsing
// https://github.com/changesets/changesets/blob/main/packages/release-utils/src/utils.ts#L5-L6

// Parse markdown into sections
function parseMarkdown(content: string): DocSection[] {
  const sections: DocSection[] = [];

  // Split content into sections based on ## headers
  const sectionRegex = /^## (.+)$/gm;
  const sectionMatches = content.split(sectionRegex);

  // const subSectionRegex = /^### (.+)$/gm;

  // Skip the first element which is content before the first section
  for (let i = 1; i < sectionMatches.length; i += 2) {
    const title = sectionMatches[i]!.trim();
    const content = sectionMatches[i + 1] || "";
    // const subSectionMatches = content.split(subSectionRegex);
    // // parseListItems from the first subSectionMatch
    // const items = parseListItems(subSectionMatches[1]!, title);
    // // save the rest as sub sections
    // const subSections = [];
    // for (let j = 2; j < subSectionMatches.length; j += 2) {
    //   const subTitle = subSectionMatches[j]!.trim();
    //   const subContent = subSectionMatches[j + 1] || "";
    //   subSections.push({ title: subTitle, content: subContent });
    // }

    const items = parseListItems(content, title);
    sections.push({ title, content, items, subSections: [] });
  }

  return sections;
}

interface ListItem {
  name: string;
  description: string;
  isNestedBlock?: boolean;
  parentBlock?: string;
  condition?: string;
}

function kebabToTitleCase(str: string): string {
  return str
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

// Parse list items from a section content
function parseListItems(content: string, sectionTitle: string): ListItem[] {
  const items: ListItem[] = [];
  const lines = content.split("\n");

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
    const whenBlockMatch = line.match(
      /^\s*When\s*`([^`]+)`\s*is\s*"([^"]+)".*$/
    );

    if (nestedBlockMatch) {
      // set parent block for next items
      nextParentBlock = nestedBlockMatch[1]!.trim();
      currentCondition = undefined;
    } else if (whenBlockMatch) {
      // set condition for next items
      nextCondition =
        whenBlockMatch[1]!.trim() + ' = "' + whenBlockMatch[2]!.trim() + '"';
    } else if (listItemMatch) {
      // Save previous item if exists
      if (currentItem && currentItem.name) {
        const description = currentDescription.join(" ").trim();
        const isNestedBlock = description.includes(
          "The structure of this block is described below"
        );
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
    const description = currentDescription.join(" ").trim();
    const isNestedBlock = description.includes(
      "The structure of this block is described below"
    );
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

// Process a single file pair (markdown and d.ts)
async function processFilePair(
  markdownPath: string,
  declarationPath: string,
  outputDir: string
) {
  console.log(`Processing: ${markdownPath} -> ${declarationPath}`);

  // Read files
  const markdownContent = fs.readFileSync(markdownPath, "utf8");

  // Parse markdown
  const sections = parseMarkdown(markdownContent);

  // // Print out parsed data and pause for key press
  // console.log(JSON.stringify(sections, null, 2));
  // await new Promise((resolve) => {
  //   process.stdin.once("data", resolve);
  // });

  const argsSection = sections.find(
    (section) => section.title === "Argument Reference"
  );

  if (!argsSection) {
    console.warn(`No 'Argument Reference' section found in ${markdownPath}`);
    return;
  }

  // Parse TypeScript
  const project = new Project();
  project.addSourceFileAtPath(declarationPath);
  const sourceFile = project.getSourceFileOrThrow(declarationPath);

  // Find the main Config interface for the resource type
  const resourceType = path.basename(path.dirname(declarationPath));
  const configInterfaceName = `${kebabToTitleCase(resourceType)}Config`;
  // `${
  //   resourceType.at(0)?.toUpperCase() + resourceType.slice(1)
  // }Config`;
  const interfaces = sourceFile.getInterfaces();
  const configInterface = interfaces.find(
    (intf) => intf.getName() === configInterfaceName
  );

  if (!configInterface) {
    console.warn(
      `No ${configInterfaceName} interface found in ${declarationPath}`
    );
    return;
  }

  // Map the markdown items to interface properties
  const rootArgs = argsSection.items.filter((i) => !i.parentBlock);
  updateInterfaceJSDoc(configInterface, rootArgs);

  // Find and update nested block interfaces
  for (const item of argsSection.items) {
    if (item.isNestedBlock) {
      const nestedType = item.name[0]!.toUpperCase() + item.name.slice(1);
      const nestedInterface = interfaces.find((intf) =>
        intf.getName().endsWith(nestedType)
      );

      if (!nestedInterface) {
        console.warn(`No nested interface found for ${nestedType}`);
        continue;
      }

      // filter argSection items by parentBlock
      const nestedArgs = argsSection.items.filter(
        (i) => i.parentBlock === item.name
      );
      if (nestedArgs.length === 0) {
        console.warn(`No nested args found for nested struct - ${item.name}`);
        continue;
      }
      updateInterfaceJSDoc(nestedInterface, nestedArgs);
    }
  }

  // Save changes to output directory
  const relativeFilePath = path.relative(
    path.resolve(process.cwd(), "data", "reference", "declarations"),
    declarationPath
  );
  const outputFilePath = path.join(outputDir, relativeFilePath);

  // Ensure output directory exists
  const outputFileDir = path.dirname(outputFilePath);
  fs.mkdirSync(outputFileDir, { recursive: true });

  // Save the file to the output location
  fs.writeFileSync(outputFilePath, sourceFile.getFullText());
  console.log(`Saved to: ${outputFilePath}`);
}

// Update JSDoc for interface properties
function updateInterfaceJSDoc(
  interfaceDecl: InterfaceDeclaration,
  items: ListItem[]
) {
  const properties = interfaceDecl.getProperties();

  for (const item of items) {
    const tsPropertyName = item.name; //toTsPropertyName(item.name);
    const property = properties.find(
      (prop) => prop.getName() === tsPropertyName
    );

    if (property) {
      updatePropertyJSDoc(property, item);
    } else {
      console.warn(
        `Property '${tsPropertyName}' not found in interface '${interfaceDecl.getName()}'`
      );
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
    if (
      existingDescription &&
      !existingDescription.includes("Docs at Terraform Registry")
    ) {
      return; // Already has a meaningful description
    }

    // Create new JSDoc with our description and preserve existing tags
    const newJsDoc: OptionalKind<JSDocStructure> = {
      description,
      tags: tags.map((tag) => {
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

// Ensure directory exists
function ensureDirExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Main function to find and process all file pairs
async function main() {
  const baseDir = path.resolve(process.cwd(), "data");
  const markdownDir = path.join(baseDir, "reference", "docs", "typescript");
  const declarationDir = path.join(baseDir, "reference", "declarations");

  ensureDirExists(outputDir);

  console.log(`Output directory: ${outputDir}`);

  // Test a single file pair
  // const markdownFile = path.join(
  //   markdownDir,
  //   "provider-aws",
  //   "r",
  //   "ami.html.markdown"
  // );
  // const declarationFile = path.join(
  //   declarationDir,
  //   "provider-aws",
  //   "ami",
  //   "index.d.ts"
  // );
  // await processFilePair(markdownFile, declarationFile, outputDir);
  for (let i = 0; i < inputMarkdownFiles.length; i++) {
    await processFilePair(
      inputMarkdownFiles[i]!,
      inputDeclarationFiles[i]!,
      outputDir
    );
  }

  // // Process all files
  // const markdownFiles = glob.sync(`${markdownDir}/**/*.markdown`);

  // for (const markdownFile of markdownFiles) {
  //   // Extract the provider and resource type from the path
  //   const relativePath = path.relative(markdownDir, markdownFile);
  //   const pathParts = relativePath.split(path.sep);

  //   if (
  //     pathParts.length >= 3 &&
  //     (pathParts[1] === "r" || pathParts[1] === "d")
  //   ) {
  //     const provider = pathParts[0]!;
  //     const resourceType = pathParts[2]!.split(".")[0]!; // Remove file extension

  //     // Construct the declaration file path
  //     const declarationFile = path.join(
  //       declarationDir,
  //       provider,
  //       resourceType,
  //       "index.d.ts"
  //     );

  //     // Check if declaration file exists
  //     if (fs.existsSync(declarationFile)) {
  //       await processFilePair(markdownFile, declarationFile, outputDir);
  //     }
  //   }
  // }
}

// Run the script
main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
