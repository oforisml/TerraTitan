# DevOps Days Singapore 2025

## Overview

This document details the goals for the DevOps Day talk, May 15 - 2025.

## Elevator Pitch

Terraform modules have served us well, but they weren’t built for the complexity of modern cloud development. This talk explores how CDKTF improves upon modules and how Generative AI helps with leveraging AWS CDK from CDKTF, providing a powerful abstraction for AWS Cloud development with Terraform.

## Talk Synopsis

Traditional IaC tools like Terraform and CloudFormation are hitting their limits. While AWS CDK introduced a better developer experience, it remains bound to CloudFormation’s constraints. Pulumi offers an alternative, but its adoption is hindered by the dominance of Terraform tooling. In this talk, we’ll explore:

- Why Terraform’s module format is fundamentally broken for modern IaC needs
- The limitations of AWS CDK and Pulumi, and how CDKTF provides a better path
- Lessons learned from months of converting AWS CDK to CDKTF
- How GenAI-powered automation is significantly accelerating this process

This session will showcase real-world GenAI automation workflows and practical takeaways for teams looking to future-proof their IaC strategy. If you’re struggling with Terraform’s limitations and wondering how AI can improve DevOps workflows, this talk is for you.

## Talk Clarifications

> [!NOTE]
> The DevOpsDays organizing committee wanted us to focus on AI, so we sent following clarifications


In the presentation we will shortly introduce the framework (and what problem it is trying to solve), and focus on how we created the AI workflow, specifically:

- Why Generative AI makes this use case possible (and is a good reference for similar use cases)
- Our data preparation for TerraConstructs LLM Workflow
- Highlight of methods and options to index structured code and code documentation for retrieval of relevant code fragments
- Iteration on Prompt design and key factors to improve LLM Accuracy in code generation
- Methods of validation and fast evaluation on generated code

## Milestones

- March 9: Kick-Off
- March 17: Currated Sample data
- March 21: High level LLM Workflow structure defined
- April 1: first version of LLM Workflow (iterable)
- April 30: "Working" version of LLM Workflow (no big changes in tech stack)
- May 7: Final version of slides
- May 13: Travel to Singapore
- May 14-15: DevOpsDays Singapore

## Slides Outline

- Introduction: Speakers + Talk Contents
- Short overview of "WHY TerraConstructs" (Short sample of DevX?)
- Short overview of TerraTitan LLM Workflow (Why build an LLM Workflow, what can it do well, what does it not do well, ...)
- Deep Dive for audience on tips/tricks for building similar LLM Workflows / simlar workcases
  - Selecting and preparing the data
  - Pre-Processing & Indexing the data for retrieval
  - Context is King: How to build Context for different LLM Models
    - How to decide what to search (keyword generation, data retrieval)
    - Running the search and populating the Context (iterations on re-ranking, ...)
  - Prompting templates and iterations depending on Models
  - Collecting output / writing to disk
  - Validating LLM (and iterate?)

## Interesting Quotes?

- March '25 - [Anthropic CEO Estimate on LLM Timeline](https://www.reddit.com/r/singularity/comments/1j8q3qi/anthropic_ceo_dario_amodei_in_the_next_3_to_6/)
- "React is the last Framework" (Theo): The hypothesis is that because so much LLM/AI is trained on React, it will be hard for other frameworks to catch up or even make it worth it to catch up.
