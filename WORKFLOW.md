Talk Notes:

- Chomsky (formal methodoloy) vs Norvig (data driven = Today's LLMs)

Pre-processing the data

- Take advantage of parser (seperate function signature from body, from docstring, ... )
- Compiler knows all this (ref: tsgo LSP support)

Input

  Context Preparation
    Decide what to search

    Search sources of data

    ReRanking: Some LLM models focus on the tail of the context, others on the front

      ReRanking relevant context before prompting depends on the LLM Model and effectiveness needs to be measured

Prompt LLM

Output

Validate
