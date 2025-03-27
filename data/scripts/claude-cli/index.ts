import Anthropic from "@anthropic-ai/sdk";
import ora from "ora";
import dotenv from "dotenv";

dotenv.config();
const anthropic = new Anthropic();

const spinner = ora(`Processing request`).start();
const startTime = performance.now();
const msg = await anthropic.messages.create({
  model: "claude-3-7-sonnet-20250219",
  max_tokens: 1000,
  temperature: 1,
  system: "Respond only with short poems.",
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Why is the ocean salty?",
        },
      ],
    },
  ],
});
const endTime = performance.now();
const responseTime = (endTime - startTime) / 1000; // Convert to seconds
spinner.succeed("Anthropic request processed");
console.log(`Response time: ${responseTime} seconds`);
console.log(msg);
