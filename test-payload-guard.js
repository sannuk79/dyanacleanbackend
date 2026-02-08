const { guard } = require('payload-guard-filter');

console.log('--- Testing payload-guard-filter ---\n');

// 1. Basic Shape-based filtering
const userShape = guard.shape({
    id: 'number',
    name: 'string',
    email: 'string',
});

const rawData = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    password: 'secret123',      // Should be removed (default sensitive)
    internalNotes: 'VIP user',  // Should be removed (unexpected)
};

const safeData = userShape(rawData);
console.log('1. Basic Filtering (expected: only id, name, email):');
console.log(JSON.stringify(safeData, null, 2));

// 2. Sensitive field protection
const sensitiveData = {
    id: 2,
    token: 'abc-123',           // Should be removed (default sensitive)
    api_key: 'key-99',          // Should be removed (default sensitive)
    name: 'Jane Doe'
};
const safeSensitiveData = userShape(sensitiveData);
console.log('\n2. Default Sensitive Field Protection (expected: no token/api_key):');
console.log(JSON.stringify(safeSensitiveData, null, 2));

// 3. Nested Objects and Arrays
const postShape = guard.shape({
    id: 'number',
    title: 'string',
    author: guard.shape({
        id: 'number',
        name: 'string'
    }),
    comments: guard.array(guard.shape({
        id: 'number',
        text: 'string'
    }))
});

const rawPost = {
    id: 101,
    title: 'Hello World',
    author: { id: 1, name: 'John', password: '123' },
    comments: [
        { id: 1, text: 'Great post!', spam: true },
        { id: 2, text: 'Nice!', token: 'xxx' }
    ],
    extra: 'remove me'
};

const safePost = postShape(rawPost);
console.log('\n3. Nested Objects and Arrays:');
console.log(JSON.stringify(safePost, null, 2));

// 4. Custom Sensitive Fields
console.log('\n4. Custom Sensitive Fields:');
guard.config({
    sensitiveFields: ['salary'],
});
const employeeShape = guard.shape({
    name: 'string',
    salary: 'number'
});
const rawEmployee = { name: 'Bob', salary: 50000 };
console.log('Before custom config:', JSON.stringify(employeeShape(rawEmployee), null, 2));
// Note: guard.config is global. Let's see if it works after being set.
console.log('After custom config (salary should be removed):', JSON.stringify(employeeShape(rawEmployee), null, 2));

console.log('\n--- Testing Completed ---');
