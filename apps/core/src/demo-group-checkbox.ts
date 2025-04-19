import groupCheckbox from 'inquire-grouped-checkbox';

async function main() {
  // Define grouped choices
  const choices = [
    {
      name: 'Fruits',
      description: 'Select your favorite fruits',
      choices: [
        { value: { item: 'apple', group: 'fruits' }, name: 'Apple', description: 'A red fruit' },
        { value: { item: 'banana', group: 'fruits' }, name: 'Banana', description: 'A yellow fruit' },
        { value: { item: 'orange', group: 'fruits' }, name: 'Orange', description: 'A citrus fruit' },
      ],
    },
    {
      name: 'Vegetables',
      description: 'Select your favorite vegetables',
      choices: [
        {
          value: { item: 'carrot', group: 'vegetables' },
          checked: true,
          name: 'Carrot',
          description: 'A crunchy vegetable',
        },
        { value: { item: 'broccoli', group: 'vegetables' }, name: 'Broccoli', description: 'A green veggie' },
      ],
    },
    { value: { item: 'water', group: 'liquids' }, name: 'Water', description: 'Just plain water' },
  ];

  // Run the grouped checkbox prompt
  try {
    const answer = await groupCheckbox({
      message: 'Select your preferred items:',
      choices,
      loop: false,
      required: true,
    });

    console.log(`\n✔ Your selection: ${answer.map(v => `${v?.item} (${v?.group})`).join(', ')}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
