
import groupCheckbox from './index';

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
