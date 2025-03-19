import fs from "fs";
import path from "path";

// TODO: use handlebars instead of manual replacement
export class Message<T> {
  /**
   * Create Message from Instructions Prompt Template
   */
  public static instructions = new Message<InstructionsPrompt>(
    "instructions-v1"
  );
  /**
   * Create Message from User Prompt Template
   */
  public static user = new Message<UserPrompt>("user-prompt-v1");
  /**
   * Create Message from AssistantSample
   */
  public static assistantSample = new Message<ConversionExample>(
    "assistant-sample-v1"
  );

  private readonly promptPath: string;
  private constructor(public readonly name: string) {
    this.promptPath = path.join(__dirname, `${name}.md`);
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
