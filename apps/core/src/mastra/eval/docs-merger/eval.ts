import fs from 'fs';
import path from "path";
import { MergeAgent } from '../../agents/docs-merger/index.js';
import { evaluate, generateReport, EvalSample } from './metrics.js';
/**
 * This script evaluates the performance of the MergeAgent by comparing its
 * generated property descriptions against a set of golden data.
 *
 * It reads markdown content and expected descriptions, runs the agent to label
 * properties, and then computes evaluation metrics.
 * It outputs a report summarizing the agent's performance.
 * Usage:
 * 1. Place your golden data in eval/docs-merger/golden.json
 * 2. Place your markdown content in eval/docs-merger/markdown.md
 * 3. Run this script with Node.js
 * Example:
 *  node eval.ts
 * This will read the golden data and markdown content, run the MergeAgent,
 * and print a report of the evaluation metrics.
 */
async function runEval() {
  // Load golden data (expected descriptions)
  const goldenDataPath = path.resolve('eval/docs-merger/golden.json');
  const goldenData: { [propName: string]: string } = JSON.parse(fs.readFileSync(goldenDataPath, 'utf-8'));

  // For example purposes, assume you get properties list and markdownContent
  const markdownContent = fs.readFileSync(path.resolve('eval/docs-merger/markdown.md'), 'utf-8');

  // Mock interface properties - replace with your real extraction logic
  const properties = Object.keys(goldenData).map(name => ({ name, existingDoc: '' }));

  // Run MergeAgent labeling
  const agent = new MergeAgent();
  const labeled = await agent.labelProperties({
    properties,
    markdownContent,
  });

  // Prepare samples for evaluation
  const samples: EvalSample[] = properties.map((prop, i) => ({
    golden: goldenData[prop.name] || '',
    predicted: labeled[i]?.description || '',
  }));

  // Evaluate predictions vs golden
  const metrics = evaluate(samples);
  const report = generateReport(metrics);

  console.log(report);
}

/**
 * Run the evaluation script
 * This will read the golden data and markdown content, run the MergeAgent,
 * and print a report of the evaluation metrics.
 * Make sure to handle any errors that may occur during the process.
 * For example, if the golden data or markdown content is not found,
 * or if the MergeAgent fails to label properties.
 * You can catch these errors and log them to the console.
 * This will help you debug any issues that arise during the evaluation.
 */
runEval().catch(console.error);
