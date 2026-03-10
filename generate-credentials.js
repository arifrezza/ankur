const fs = require('fs');
const path = require('path');

/**
 * Script to generate sample credentials for testing
 * Usage: node generate-credentials.js <number_of_users>
 */

const numUsers = process.argv[2] || 50;
const credentials = [];

for (let i = 1; i <= numUsers; i++) {
    credentials.push({
        email: `user${i}@example.com`,
        password: `password${i}`
    });
}

const outputPath = path.join(__dirname, 'data', 'credentials.json');
fs.writeFileSync(outputPath, JSON.stringify(credentials, null, 2));

console.log(`✓ Generated ${numUsers} sample credentials in ${outputPath}`);
console.log(`\nPlease replace these with your actual credentials before running tests!`);
