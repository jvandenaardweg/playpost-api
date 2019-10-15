module.exports = {
  globals: {
    NODE_ENV: 'test'
  },
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: ['**/*.{ts,tsx,js,jsx,json,node}', '!**/node_modules/**', '!**/typings/**', '!**/integration/**']
};
