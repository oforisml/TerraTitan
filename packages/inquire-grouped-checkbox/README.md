# Grouped Checkbox Prompt

The **Grouped Checkbox Prompt** is an enhanced version of the traditional checkbox prompt that supports two-level nesting. With this prompt, you can organize choices into groups where each group header can select or deselect all of its child choices. The prompt also automatically updates the group header’s state when individual children are toggled.

Written based on:

- [inquire.js core](https://github.com/SBoudrias/Inquirer.js/blob/main/packages/core/README.md#basic-concept)
- [inquire.js checkbox](https://github.com/SBoudrias/Inquirer.js/blob/main/packages/checkbox/src/index.ts)

## Features

- **Two-Level Nesting:** Organize items in groups with child choices.
- **Grouped Selection:** Toggle all child choices by selecting or deselecting the group header.
- **Individual Toggle:** Update group header state based on the state of its child choices.
- **Keyboard Shortcuts:** Supports arrow keys, space bar, number keys for quick toggling, and custom shortcuts.
- **Validation & Theming:** Works with required validations and custom themes.

## Installation

```bash
pnpm install
```

## Example Usage

Below is an example program demonstrating how to use the grouped checkbox prompt within a terminal application.

```ts
// demo.ts
import groupCheckbox from 'inquire-grouped-checkbox';

async function main() {
  // Define grouped choices
  const choices = [
    {
      name: 'Fruits',
      description: 'Select your favorite fruits',
      choices: [
        { value: 'apple', name: 'Apple', description: 'A red fruit' },
        { value: 'banana', name: 'Banana', description: 'A yellow fruit' },
        { value: 'orange', name: 'Orange', description: 'A citrus fruit' }
      ]
    },
    {
      name: 'Vegetables',
      description: 'Select your favorite vegetables',
      choices: [
        { value: 'carrot', name: 'Carrot', description: 'A crunchy vegetable' },
        { value: 'broccoli', name: 'Broccoli', description: 'A green veggie' }
      ]
    },
    { value: 'water', name: 'Water', description: 'Just plain water' }
  ];

  // Run the grouped checkbox prompt
  try {
    const answer = await groupCheckbox({
      message: 'Select your preferred items:',
      choices,
      // Optionally, include extra properties such as shortcuts, pageSize, etc.
      pageSize: 7,
      required: true
    });

    console.log(`\n✔ Your selection: ${answer.join(', ')}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

### How It Works

- **Configuration:** In the example above, we define choices that include two groups ("Fruits" and "Vegetables") and an individual option ("Water").
- **Grouped Behavior:** When you toggle a group header, all child choices within that group are selected or deselected together.
- **Running the Prompt:** The prompt uses keyboard shortcuts:
  - **Arrow keys** to navigate.
  - **Space bar** to toggle an item.
  - **Number keys** to toggle specific items by index.
  - **Enter** key to finish the selection.bun
- **Required Validation:** The prompt validates input if `required` is set to true.

## Running the Example

Compile the TypeScript code (if needed) and run the script in your terminal:

```bash
pnpm run demo
```

After running, the terminal will display the grouped checkbox prompt. Use the navigation keys and space bar as described to make your selections.

Run the tests with:

```bash
pnpm test
```

Make sure all snapshots are either updated or the implementation matches the snapshots exactly.
