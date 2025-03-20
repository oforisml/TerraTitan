import fs from "fs";
import path from "path";
import { ConversionType } from "../util/types";

export interface PromptTemplateNames {
  /**
   * The Instructions Prompt Template
   */
  instructions: string;
  /**
   * The User Prompt Template
   */
  userPrompt: string;
  /**
   * The Assistant Sample Template
   */
  assistantSample: string;
}

export function loadTemplates(
  names: PromptTemplateNames,
  templateType: ConversionType = ConversionType.SOURCE
): PromptTemplates {
  return {
    instructions: Message.fromTemplateName(names.instructions, templateType),
    user: Message.fromTemplateName(names.userPrompt, templateType),
    assistantSample: Message.fromTemplateName(
      names.assistantSample,
      templateType
    ),
  };
}

export interface PromptTemplates {
  instructions: Message<InstructionsPrompt>;
  user: Message<UserPrompt>;
  assistantSample: Message<ConversionExample>;
}

// TODO: use handlebars instead of manual replacement
export class Message<T> {
  /**
   * Create Message from Instructions Prompt Template for source file conversions
   */
  public static instructions = new Message<InstructionsPrompt>(
    "instructions-v1"
  );
  /**
   * Create Message from User Prompt Template for source file conversions
   */
  public static user = new Message<UserPrompt>("user-prompt-v1");
  /**
   * Create Message from AssistantSample for source file conversions
   */
  public static assistantSample = new Message<ConversionExample>(
    "assistant-sample-v1"
  );

  public static fromTemplateName<T>(
    name: string,
    templateType: ConversionType = ConversionType.SOURCE
  ): Message<T> {
    return new Message<T>(name, templateType);
  }

  private readonly promptPath: string;
  private constructor(
    public readonly name: string,
    private readonly baseDir: ConversionType = ConversionType.SOURCE
  ) {
    this.promptPath = path.join(__dirname, this.baseDir, `${name}.md`);
  }

  private _text: string | undefined = undefined;
  get text(): string {
    if (this._text) {
      return this._text;
    }
    this._text = fs.readFileSync(this.promptPath, "utf8");
    return this._text;
  }

  render(data: { [K in keyof T]: string }) {
    let renderedText = this.text;
    for (const [key, value] of Object.entries(data)) {
      renderedText = renderedText.replace(`{{${key}}}`, String(value));
    }
    return renderedText;
  }
}

export interface InstructionsPrompt {
  /**
   * The TerraConstructs Core module TS declaration files
   */
  core: string;
  /**
   * The TerraConstructs AWS module TS declaration files
   */
  aws: string;
  /**
   * The TerraConstructs Test Helpers TS declaration files
   */
  testing: string;
  /**
   * one-shot Conversion Sample Input (included in instructions)
   */
  sampleInput: string;
  /**
   * The AWS CDK L1 Generated Constructs (`Cfn...`) TS declaration files
   *
   * NOTE: This is filtered to only include the `Cfn...` constructs detected in `sampleInput`
   */
  sampleInputRef: string;
  /**
   * one-shot Conversion Sample Output  (included in instructions)
   */
  sampleOutput: string;
  /**
   * The Terraform Provider AWS TS declaration files.
   *
   * ideally augmented by merging Registry docs into them.
   *
   * @see scripts/merge-docs.ts
   */
  sampleOutputRefs: string;
}

export interface UserPrompt {
  /**
   * The AWS CDK code to convert
   */
  input: string;
  /**
   * The AWS CDK L1 Generated Constructs (`Cfn...`) TS declaration files
   *
   * NOTE: This is filtered to only include the `Cfn...` constructs detected in `input`
   */
  inputRef: string;
  /**
   * The Terraform Provider AWS TS declaration files.
   *
   * ideally augmented by merging Registry docs into them.
   *
   * @see scripts/merge-docs.ts
   */
  outputRefs: string;
}

export interface ConversionExample {
  /**
   * An example conversion from AWS CDK to Terraform CDK
   */
  output: string;
}
