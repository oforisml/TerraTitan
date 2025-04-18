import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import groupCheckbox, { Separator } from './index';

describe('grouped checkbox prompt', () => {
  it('toggles group header selecting all its child choices', async () => {
    const choices = [
      {
        name: 'Fruits',
        choices: [
          { value: 'apple', name: 'Apple' },
          { value: 'banana', name: 'Banana' },
        ],
      },
      { value: 'Carrot', name: 'Carrot' },
    ];

    const { answer, events, getScreen } = await render(groupCheckbox, {
      message: 'Select items',
      choices,
    });

    // Initial render should show the group header with its indented children.
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select items (Press space to select, a to toggle all, i to invert selection,
      and enter to proceed)
      ◻ Fruits
         ◯ Apple
         ◯ Banana
       ◯ Carrot"
    `);

    // Toggle the group header ("Fruits") with space
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select items
      ◼ Fruits
         ◉ Apple
         ◉ Banana
       ◯ Carrot"
    `);

    // Navigate to the next selectable item ("Carrot") and toggle it
    events.keypress('down'); // from group header to first child (Apple)
    events.keypress('down'); // Apple → Banana
    events.keypress('down'); // Banana → Carrot
    events.keypress('space'); // toggle Carrot
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select items
      ◼ Fruits
         ◉ Apple
         ◉ Banana
      ❯◉ Carrot"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(['apple', 'banana', 'Carrot']);
  });

  it('updates group header state when an individual child is toggled', async () => {
    const choices = [
      {
        name: 'Colors',
        choices: [
          { value: 'red', name: 'Red' },
          { value: 'blue', name: 'Blue' },
        ],
      },
    ];

    const { answer, events, getScreen } = await render(groupCheckbox, {
      message: 'Select colors',
      choices,
    });

    // Initial render
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select colors (Press space to select, a to toggle all, i to invert selection,
      and enter to proceed)
      ◻ Colors
         ◯ Red
         ◯ Blue"
    `);

    // Toggle the group header so both children get selected.
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select colors
      ◼ Colors
         ◉ Red
         ◉ Blue"
    `);

    // Navigate into children; toggle "Red" off
    events.keypress('down'); // focus on Red
    events.keypress('space'); // toggle Red off
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select colors
      ◻ Colors
        ❯◯ Red
         ◉ Blue"
    `);

    // Move back to the group header: it should now update to unchecked.
    events.keypress('up');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select colors
      ◻ Colors
         ◯ Red
         ◉ Blue"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(['blue']);
  });

  it('supports number key selection on grouped choices', async () => {
    // The expected selectable items are:
    // 1. Group header "Animals"
    // 2. Child "Cat"
    // 3. Child "Dog"
    // 4. Top-level "Lion"
    const choices = [
      {
        name: 'Animals',
        choices: [
          { value: 'cat', name: 'Cat' },
          { value: 'dog', name: 'Dog' },
        ],
      },
      { value: 'lion', name: 'Lion' },
    ];

    const { answer, events, getScreen } = await render(groupCheckbox, {
      message: 'Select animals',
      choices,
    });

    // Pressing '2' should target the second selectable item ("Cat")
    events.keypress('2');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select animals (Press space to select, a to toggle all, i to invert selection,
       and enter to proceed)
      ◻ Animals
        ❯◉ Cat
         ◯ Dog
       ◯ Lion"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(['cat']);
  });

  it('throws if all group choices are disabled', async () => {
    // The entire group is disabled
    const choices = [
      {
        name: 'Numbers',
        choices: [
          { value: 1, name: 'One', disabled: true },
          { value: 2, name: 'Two', disabled: true },
        ],
        disabled: true,
      },
    ];

    const { answer } = await render(groupCheckbox, {
      message: 'Select a number',
      choices,
    });

    await expect(answer).rejects.toThrowErrorMatchingInlineSnapshot(
      `[ValidationError: [checkbox prompt] No selectable choices. All choices are disabled.]`,
    );
  });

  it('shows validation message if required and no group child is selected', async () => {
    const choices = [
      {
        name: 'Letters',
        choices: [
          { value: 'A', name: 'A' },
          { value: 'B', name: 'B' },
        ],
      },
    ];

    const { answer, events, getScreen } = await render(groupCheckbox, {
      message: 'Select a letter',
      choices,
      required: true,
    });

    events.keypress('enter');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a letter (Press space to select, a to toggle all, i to invert
      selection, and enter to proceed)
      ◻ Letters
         ◯ A
         ◯ B
      At least one choice must be selected"
    `);

    // Toggle a child
    events.keypress('down'); // focus moves to first child "A"
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a letter
      ◻ Letters
        ❯◉ A
         ◯ B"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(['A']);
  });
});
