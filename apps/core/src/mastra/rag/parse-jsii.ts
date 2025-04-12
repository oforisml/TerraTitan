/**
 * Parse a JSII Assembly and extract AWS resources
 * and their documentation as Reference Data for embedding.
 *
 * provide sample TextToEmbed for each resource containing:
 *
 * - Markdown Summary Section
 * - Markdown Arguments Section
 *
 * Warn on token count exceeding OpenAI's limit for 'text-embedding-3-small' / 'text-embedding-3-large'
 */
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
import * as reflect from 'jsii-reflect';
import { TiktokenModel } from 'tiktoken';
import { hasPropsParam } from '../util/type-system/index.js';
import { schemaForTypeReference } from '../util/type-system/jsii2schema.js';
import { gitRoot } from '../util/helpers.js';
import { TokenCounter } from '../util/tiktoken.js';
// used to generate warnings
import { OPENAI_EMBED_MAX_TOKENS } from '../util/rag.js';

const fileName = 'aws-resources';

// used for token counting
const embeddingModel: TiktokenModel = 'text-embedding-3-small';

export interface ParsedResource {
  fqn: string;
  name: string;
  namespace?: string;
  docs: {
    subcategory?: string;
    pageTitle?: string;
    metaDescription?: string;
    summary?: string;
    url?: string;
    path?: string;
    resourceType?: string;
  };
  arguments?: string;
  constructor?: reflect.TypeReference | undefined;
  sourceFile?: string;
  textToEmbed: string;
  textToEmbedCount: number;
}

// ensure directory exists
const outputDir = path.join(process.cwd(), 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}
const outputFile = path.join(outputDir, fileName + '.json');

if (fs.existsSync(outputFile)) {
  // file already exists - exit
  console.log('File already exists:', outputFile);
  process.exit(0);
}

const parsedResources: ParsedResource[] = [];
const counter = new TokenCounter(embeddingModel);

// Load the cdktf/provider-aws assembly via jsii-reflect:
const require = createRequire(import.meta.url);
const ts = new reflect.TypeSystem();
// (must load full dependency tree: constructs > cdktf > provider-aws)
const assemblies = ['constructs', 'cdktf', '@cdktf/provider-aws'];
await Promise.all(
  assemblies.map(assembly => {
    const assemblyPath = require.resolve(`${assembly}/.jsii`);
    return ts.load(assemblyPath);
  }),
);

// find L1 terraform resources (which extend tfResourceBase)
const tfResourceBase = ts.findClass('cdktf.TerraformResource');
const tfResources = ts.classes.filter(c => c.extends(tfResourceBase));
// extract constructor (initializer) and the constructor props
const awsResources = [...tfResources.map(c => unpackTopLevel(c, 2))].filter((c): c is ClassAndProps => !!c);

// extract {@link ...} value
const linkRegex = /{@link\s+([^\s}]+)(?:\s+[^}]+)?}/;
// Find the frontmatter section between --- markers
const frontmatterRegex = /---\s*\n([\s\S]*?)\n---/;
// Extract content between "# Resource:" and the next heading
const resourceRegex = /# Resource:.*?\n\n([\s\S]*?)(?=\n## |$)/;
// Extract argument reference section
const argumentsRegex = /## Argument Reference\s*\n\n([\s\S]*?)(?=\n## |$)/;

console.log('Found ' + awsResources.length + ' AWS resources');
const tsAwsDocs = path.join(gitRoot, 'data', 'reference', 'docs', 'typescript', 'provider-aws');
for (const resource of awsResources) {
  if (!resource.class.fqn.startsWith('@cdktf/provider-aws.')) {
    console.log('Skipping resource ' + resource.class.fqn);
    continue;
  }
  const fqn = resource.class.fqn;
  const name = resource.class.name;
  const namespace = resource.class.namespace;
  const docsSummary = resource.class.docs?.summary || '';
  let markdownDocs: string | undefined;
  let docDescription: string | undefined;
  let argumentsSection: string | undefined;
  let docFilePath: string | undefined;
  let subcategory: string | undefined;
  let pageTitle: string | undefined;
  let metaDescription: string | undefined;

  const match = docsSummary.match(linkRegex);
  const docUrl = match ? match[1] : undefined;

  // Parse the URL to extract the path
  let resourceType: string | undefined;
  if (docUrl) {
    try {
      const parsedUrl = new URL(docUrl);
      // Remove the leading slash from pathname
      const docPath = parsedUrl.pathname.startsWith('/') ? parsedUrl.pathname.substring(1) : parsedUrl.pathname;

      // Split the path and pop the last part (e.g., "ami")
      let resourceName = docPath.split('/').pop();
      // some resourceNames are mapped, i.e. alb -> lb, alb_listener -> lb_listener
      if (resourceName && resourceName.startsWith('alb')) {
        resourceName = resourceName.replace('alb', 'lb');
      }
      docFilePath = path.join(tsAwsDocs, 'r', `${resourceName}.html.markdown`);
      try {
        markdownDocs = fs.readFileSync(docFilePath, 'utf-8');

        const frontmatterMatch = markdownDocs.match(frontmatterRegex);

        if (frontmatterMatch && frontmatterMatch[1]) {
          const frontmatter = frontmatterMatch[1];

          // Extract subcategory
          const subcategoryMatch = frontmatter.match(/subcategory:\s*"([^"]+)"/);
          if (subcategoryMatch && subcategoryMatch[1]) {
            subcategory = subcategoryMatch[1];
          }

          // Extract page_title
          const pageTitleMatch = frontmatter.match(/page_title:\s*"([^"]+)"/);
          if (pageTitleMatch && pageTitleMatch[1]) {
            pageTitle = pageTitleMatch[1];
          }

          // Extract description (may be multi-line with |- syntax)
          const descriptionMatch = frontmatter.match(/description:\s*\|-\s*\n\s*(.*?)(\n\s*\w|$)/);
          if (descriptionMatch && descriptionMatch[1]) {
            metaDescription = descriptionMatch[1].trim();
          }
        }

        const match = markdownDocs.match(resourceRegex);

        if (match && match[1]) {
          docDescription = match[1].trim();
        }

        const argumentsMatch = markdownDocs.match(argumentsRegex);
        if (argumentsMatch && argumentsMatch[1]) {
          argumentsSection = argumentsMatch[1].trim();
        }
      } catch (fileError) {
        console.warn(`Failed to read documentation file for ${resourceType}: ${fileError}`);
      }
    } catch (error) {
      console.warn(`Failed to parse URL ${docUrl}: ${error}`);
    }
  }
  const sourceFile = resource.class.locationInModule?.filename || '';

  // Consider adding more fields or structuring differently if needed
  // this is just a sample Text to embed, the actual embedding may be different
  const textToEmbed = `
      Subcategory: ${subcategory}
      FQN: ${fqn}
      Name: ${name}
      Description: ${docDescription}
      Arguments: ${argumentsSection}
    `.trim();
  const [textToEmbedCount = 0] = counter.count(textToEmbed);

  // warn if text to embed exceeds maxTokens
  if (textToEmbedCount > OPENAI_EMBED_MAX_TOKENS) {
    console.warn(`Text to embed for ${fqn} exceeds ${OPENAI_EMBED_MAX_TOKENS} tokens: ${textToEmbedCount}`);
  }

  // Build the enriched JSON object:
  parsedResources.push({
    fqn,
    name,
    namespace,
    docs: {
      subcategory,
      pageTitle,
      metaDescription,
      summary: docDescription,
      url: docUrl,
      path: docFilePath ? path.relative(gitRoot, docFilePath) : undefined,
      resourceType,
    },
    arguments: argumentsSection,
    constructor: schemaForProps(resource.propsTypeRef),
    textToEmbed,
    textToEmbedCount,
    sourceFile,
  });
}

// write to file for caching
fs.writeFileSync(outputFile, JSON.stringify(parsedResources, null, 2));
console.log('Wrote to ' + outputFile);

// JSII Utility functions and interfaces

function schemaForProps(propsTypeRef: reflect.TypeReference | undefined) {
  if (!propsTypeRef) {
    return;
  }
  // if (propsTypeRef.fqn?.startsWith("@cdktf/provider-aws.")) {
  //   console.log("Skipping props " + propsTypeRef.fqn);
  //   return;
  // }
  return schemaForTypeReference(propsTypeRef);
}

// find initializer and props parameter index for a class
function unpackTopLevel(klass: reflect.ClassType, propsParamAt: number): ClassAndProps | undefined {
  if (!hasPropsParam(klass, propsParamAt)) {
    console.log('skipping (no propsParam) ' + (klass as reflect.ClassType).fqn);
    return undefined;
  }

  return {
    class: klass,
    propsTypeRef: klass.initializer?.parameters?.[propsParamAt]?.type,
  };
}

interface ClassAndProps {
  class: reflect.ClassType;
  propsTypeRef?: reflect.TypeReference;
}
