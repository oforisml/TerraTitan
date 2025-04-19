import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  useRef,
  useMemo,
  makeTheme,
  isUpKey,
  isDownKey,
  isSpaceKey,
  isNumberKey,
  isEnterKey,
  ValidationError,
  Separator,
  type Theme,
  type Status,
} from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';
import colors from 'yoctocolors';
import figures from '@inquirer/figures';
import ansiEscapes from 'ansi-escapes';

/**
 * Extended types for two‑level grouping.
 *
 * A normal choice looks much like before.
 */
export type Choice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  short?: string;
  disabled?: boolean | string;
  checked?: boolean;
  // Notice: do not supply a “type” property – we reserve that for our internal use.
};

type NormalizedChoice<Value> = {
  value: Value;
  name: string;
  description?: string;
  short: string;
  disabled: boolean | string;
  checked: boolean;
};

/**
 * A group “choice” consists of a group header (which has a name,
 * optional description and disabled/checked) plus an array of child choices.
 */
export type GroupChoice<Value> = {
  name: string; // group header label
  description?: string;
  short?: string;
  disabled?: boolean | string;
  // Initial state: if provided, these children will be pre-selected.
  checked?: boolean;
  choices: Array<Choice<Value>>;
};

/**
 * The union type for allowed top‑level items.
 * Separators are allowed as before.
 */
export type GroupedChoice<Value> = Choice<Value> | GroupChoice<Value> | Separator;

/**
 * Internally we “flatten” the configuration choices into a list of “flat items.”
 * For a group header and its children we mark the header’s item type as 'group'
 * while its children are marked 'choice' with an extra flag `indent` and pointer `parent`.
 */
type FlatItem<Value> = {
  // A unique key (we use the array index later)
  id: number;
  // One of three types: a group header, an individual choice, or a separator.
  type: 'group' | 'choice' | 'separator';
  // For items of type 'group' the value is not used.
  value?: Value;
  name: string;
  description?: string;
  short: string;
  disabled: boolean | string;
  checked: boolean;
  // If a child of a group, we indent it.
  indent?: boolean;
  // If a child, record its parent index in the flat list.
  parent?: number;
};

//
// The new configuration type for the grouped checkbox prompt:
//
export type GroupCheckboxConfig<Value> = {
  message: string;
  prefix?: string;
  pageSize?: number;
  instructions?: string | boolean;
  choices: ReadonlyArray<GroupedChoice<Value>>;
  loop?: boolean;
  required?: boolean;
  validate?: (choices: ReadonlyArray<Choice<Value>>) => boolean | string | Promise<string | boolean>;
  theme?: PartialDeep<Theme<CheckboxTheme>>;
  shortcuts?: CheckboxShortcuts;
};

//
// We reuse a theme similar to the original, though you may want to adjust the icons
// for groups (for example, to use a different symbol for a “group header”).
//
type CheckboxTheme = {
  icon: {
    checked: string;
    unchecked: string;
    cursor: string;
  };
  style: {
    disabledChoice: (text: string) => string;
    renderSelectedChoices: <T>(
      selectedChoices: ReadonlyArray<NormalizedChoice<T>>,
      allChoices: ReadonlyArray<NormalizedChoice<T> | Separator>,
    ) => string;
    description: (text: string) => string;
    // New: for rendering group headers.
    group: (text: string, isChecked: boolean) => string;
    // For highlighting keys in hints
    key: (text: string) => string;
    // For messages, answers, etc.
    answer: (text: string) => string;
    message: (text: string, status: 'idle' | 'done' | 'loading') => string;
    help: (text: string) => string;
    highlight: (text: string) => string;
    error: (text: string) => string;
  };
  helpMode: 'always' | 'never' | 'auto';
};

const checkboxTheme: CheckboxTheme = {
  icon: {
    checked: colors.green(figures.circleFilled),
    unchecked: figures.circle,
    cursor: figures.pointer,
  },
  style: {
    disabledChoice: (text: string) => colors.dim(`- ${text}`),
    renderSelectedChoices: selectedChoices => selectedChoices.map(choice => choice.short).join(', '),
    description: (text: string) => colors.cyan(text),
    group: (text: string, isChecked: boolean) =>
      (isChecked ? colors.green(figures.squareSmallFilled) : figures.squareSmall) + ' ' + text,
    key: (text: string) => colors.yellow(text),
    answer: (text: string) => colors.cyan(text),
    message: (text: string) => colors.bold(text),
    help: (text: string) => colors.dim(text),
    highlight: (text: string) => colors.bold(text),
    error: (text: string) => colors.red(text),
  },
  helpMode: 'auto',
};

//
// We also allow a couple of keyboard shortcuts (e.g. select all, invert selection)
//
type CheckboxShortcuts = {
  all?: string | null;
  invert?: string | null;
};

//
// Helper: Flatten the provided choices into a single list of FlatItem.
// In this process, group objects become a “group header” item followed by their child items (marked with indent).
//
function normalizeGroupedChoices<Value>(choices: ReadonlyArray<GroupedChoice<Value>>): FlatItem<Value>[] {
  const flatItems: FlatItem<Value>[] = [];
  let id = 0;
  for (const item of choices) {
    if (Separator.isSeparator(item)) {
      flatItems.push({
        id: id++,
        type: 'separator',
        name: item.separator,
        short: '',
        disabled: false,
        checked: false,
      });
    } else if ('choices' in item) {
      // It’s a group header.
      const groupDisabled = item.disabled ?? false;
      // The header itself—its checked state we will later compute from its children.
      const groupItem: FlatItem<Value> = {
        id: id++,
        type: 'group',
        name: item.name,
        short: item.short ?? item.name,
        description: item.description,
        disabled: groupDisabled,
        checked: Boolean(item.checked), // initial state if provided
      };
      flatItems.push(groupItem);

      // Add each child as an indented item.
      for (const child of item.choices) {
        // A child might be provided as a string. Normalize as before.
        let normalizedChild: FlatItem<Value>;
        if (typeof child === 'string') {
          normalizedChild = {
            id: id++,
            type: 'choice',
            value: child as Value,
            name: child,
            short: child,
            disabled: false,
            checked: false,
            indent: true,
            parent: groupItem.id,
          };
        } else {
          const childName = child.name ?? String(child.value);
          normalizedChild = {
            id: id++,
            type: 'choice',
            value: child.value,
            name: childName,
            short: child.short ?? childName,
            disabled: child.disabled ?? false,
            checked: child.checked ?? false,
            indent: true,
            parent: groupItem.id,
          };
        }
        flatItems.push(normalizedChild);
      }
    } else {
      // A simple choice.
      const choiceName = item.name ?? String(item.value);
      flatItems.push({
        id: id++,
        type: 'choice',
        value: item.value,
        name: choiceName,
        short: item.short ?? choiceName,
        disabled: item.disabled ?? false,
        checked: item.checked ?? false,
      });
    }
  }
  return flatItems;
}

/**
 * Update the checked state of any group headers in the flatItems array.
 * If all children of a group header are checked, then mark the group header as checked;
 * otherwise, it appears unchecked.
 */
function updateGroupStatus<Value>(flatItems: FlatItem<Value>[]): FlatItem<Value>[] {
  // First, create a map from group header id to the list of indices for its children.
  const groupMap = new Map<number, number[]>();
  flatItems.forEach((item, index) => {
    if (item.type === 'choice' && item.indent && item.parent != null) {
      const list = groupMap.get(item.parent) || [];
      list.push(index);
      groupMap.set(item.parent, list);
    }
  });
  // Then for each group header, update its checked state.
  flatItems = flatItems.map(item => {
    if (item.type === 'group') {
      const childrenIndices = groupMap.get(item.id);
      if (childrenIndices && childrenIndices.length > 0) {
        // If every child is checked (and selectable), mark group as checked.
        const allChecked = childrenIndices.every(i => flatItems[i]!.checked);
        return { ...item, checked: allChecked };
      }
    }
    return item;
  });
  return flatItems;
}

/**
 * Helper: Determines if the flat item is selectable.
 * (Separators are not, and disabled items are skipped.)
 */
function isSelectable<Value>(item: FlatItem<Value>): boolean {
  return item.type !== 'separator' && !item.disabled;
}

/**
 * Toggle a flat item. If it is a group header, toggle all its children.
 * Otherwise, simply toggle the single item.
 */
function toggleItem<Value>(flatItems: FlatItem<Value>[], index: number): FlatItem<Value>[] {
  const item = flatItems[index]!;
  if (!isSelectable(item)) return flatItems;
  // If this is a group header, toggle all child items.
  if (item.type === 'group') {
    const newChecked = !item.checked;
    return flatItems.map(curr => {
      // For group header (matching id) and its children (matching parent), update.
      if (curr.id === item.id || curr.parent === item.id) {
        // Only update selectable items.
        if (isSelectable(curr)) {
          return { ...curr, checked: newChecked };
        }
      }
      return curr;
    });
  } else {
    // For a single choice, simply toggle its checked state.
    flatItems = flatItems.map((curr, i) => (i === index ? { ...curr, checked: !curr.checked } : curr));
    return flatItems;
  }
}

//
// Now the prompt implementation:
//
export default createPrompt(<Value>(config: GroupCheckboxConfig<Value>, done: (value: Array<Value>) => void) => {
  const { instructions, pageSize = 7, loop = true, required, validate = () => true } = config;
  const shortcuts: CheckboxShortcuts = { all: 'a', invert: 'i', ...config.shortcuts };
  const theme = makeTheme<CheckboxTheme>(checkboxTheme, config.theme);
  const firstRender = useRef(true);
  const [status, setStatus] = useState<Status>('idle');
  const prefix = usePrefix({ status, theme });

  // Normalize and flatten the choices.
  const [flatItems, setFlatItems] = useState<FlatItem<Value>[]>(
    updateGroupStatus(normalizeGroupedChoices(config.choices)),
  );

  // Compute bounds: find first and last selectable indexes.
  const bounds = useMemo(() => {
    const first = flatItems.findIndex(item => isSelectable(item));
    const last = flatItems.reduce((acc, item, i) => (isSelectable(item) ? i : acc), -1);
    if (first === -1) {
      throw new ValidationError('[checkbox prompt] No selectable choices. All choices are disabled.');
    }
    return { first, last };
  }, [flatItems]);

  const [active, setActive] = useState(bounds.first);
  const [showHelpTip, setShowHelpTip] = useState(true);
  const [errorMsg, setError] = useState<string>();

  useKeypress(async key => {
    if (isEnterKey(key)) {
      // When done, we collect selected individual choices only (ignore group headers).
      const selection = flatItems.filter(item => item.type === 'choice' && item.checked && isSelectable(item));
      const isValid = await validate(
        // Recover a normalized version of the underlying choices.
        selection.map(i => ({
          value: i.value as Value,
          name: i.name,
          short: i.short,
          disabled: i.disabled,
          checked: i.checked,
        })),
      );
      if (required && !flatItems.some(i => i.checked && i.type === 'choice')) {
        setError('At least one choice must be selected');
      } else if (isValid === true) {
        setStatus('done');
        done(selection.map(choice => choice.value as Value));
      } else {
        setError((isValid as string) || 'You must select a valid value');
      }
    } else if (isUpKey(key) || isDownKey(key)) {
      // Navigate up and down.
      if (loop || (isUpKey(key) && active !== bounds.first) || (isDownKey(key) && active !== bounds.last)) {
        const offset = isUpKey(key) ? -1 : 1;
        let next = active;
        do {
          next = (next + offset + flatItems.length) % flatItems.length;
        } while (!isSelectable(flatItems[next]!));
        setActive(next);
      }
    } else if (isSpaceKey(key)) {
      setError(undefined);
      setShowHelpTip(false);
      // Toggle the currently active item.
      const newItems = toggleItem(flatItems, active);
      // Update group header state if a child was toggled.
      setFlatItems(updateGroupStatus(newItems));
    } else if (key.name === shortcuts.all) {
      // Shortcut to toggle all: check if any selectable item is unchecked.
      const selectAll = flatItems.some(item => isSelectable(item) && !item.checked && item.type === 'choice');
      const newItems = flatItems.map(item => {
        if (isSelectable(item) && (item.type === 'choice' || item.type === 'group')) {
          return { ...item, checked: selectAll };
        }
        return item;
      });
      setFlatItems(updateGroupStatus(newItems));
    } else if (key.name === shortcuts.invert) {
      const newItems = flatItems.map(item => {
        if (isSelectable(item) && (item.type === 'choice' || item.type === 'group')) {
          return { ...item, checked: !item.checked };
        }
        return item;
      });
      setFlatItems(updateGroupStatus(newItems));
    } else if (isNumberKey(key)) {
      // Allow number key shortcut: e.g. pressing '3' toggles the third selectable item.
      const position = Number(key.name) - 1;
      let count = 0;
      let targetIndex: number | null = null;
      for (let i = 0; i < flatItems.length; i++) {
        if (isSelectable(flatItems[i]!)) {
          if (count === position) {
            targetIndex = i;
            break;
          }
          count++;
        }
      }
      if (targetIndex != null) {
        setActive(targetIndex);
        const newItems = toggleItem(flatItems, targetIndex);
        setFlatItems(updateGroupStatus(newItems));
      }
    }
  });

  const message = theme.style.message(config.message, status);

  let extraDescription: string | undefined;
  const page = usePagination({
    items: flatItems,
    active,
    renderItem({ item, isActive }) {
      // Render separators as before.
      if (item.type === 'separator') {
        return ` ${item.name}`;
      }

      // If this is a group header, render with group styling.
      if (item.type === 'group') {
        const rendered = theme.style.group(item.name, item.checked);
        return rendered;
      }

      // For child items (and non-indented choices), render a checkbox.
      const checkbox = item.checked ? theme.icon.checked : theme.icon.unchecked;
      const color = isActive ? theme.style.highlight : (x: string) => x;
      // Indent children.
      const indent = item.indent ? '  ' : '';
      if (isActive && !item.indent) {
        extraDescription = item.description;
      } else if (isActive && item.indent && item.description) {
        // If a child is active, show its description.
        extraDescription = item.description;
      }
      const cursor = isActive ? theme.icon.cursor : ' ';
      return color(`${indent}${cursor}${checkbox} ${item.name}`);
    },
    pageSize,
    loop,
  });

  if (status === 'done') {
    const selection = flatItems.filter(item => item.type === 'choice' && item.checked && isSelectable(item));
    const answer = theme.style.answer(
      theme.style.renderSelectedChoices(
        selection.map(i => ({
          value: i.value as Value,
          name: i.name,
          short: i.short,
          disabled: i.disabled,
          checked: i.checked,
        })),
        [], // Optionally, you could pass the original list of choices.
      ),
    );
    return `${prefix} ${message} ${answer}`;
  }

  let helpTipTop = '';
  let helpTipBottom = '';
  if (
    theme.helpMode === 'always' ||
    (theme.helpMode === 'auto' && showHelpTip && (instructions === undefined || instructions))
  ) {
    if (typeof instructions === 'string') {
      helpTipTop = instructions;
    } else {
      const keys = [
        `${theme.style.key('space')} to select`,
        shortcuts.all ? `${theme.style.key(shortcuts.all)} to toggle all` : '',
        shortcuts.invert ? `${theme.style.key(shortcuts.invert)} to invert selection` : '',
        `and ${theme.style.key('enter')} to proceed`,
      ];
      helpTipTop = ` (Press ${keys.filter(Boolean).join(', ')})`;
    }

    if (
      flatItems.length > pageSize &&
      (theme.helpMode === 'always' || (theme.helpMode === 'auto' && firstRender.current))
    ) {
      helpTipBottom = `\n${theme.style.help('(Use arrow keys to reveal more choices)')}`;
      firstRender.current = false;
    }
  }

  const choiceDescription = extraDescription ? `\n${theme.style.description(extraDescription)}` : ``;

  let error = '';
  if (errorMsg) {
    error = `\n${theme.style.error(errorMsg)}`;
  }

  return `${prefix} ${message}${helpTipTop}\n${page}${helpTipBottom}${choiceDescription}${error}${ansiEscapes.cursorHide}`;
});

//
// (Optionally, you could export Separator as before)
//
export { Separator };
