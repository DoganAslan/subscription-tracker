module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/firestore\\.rules\\.test\\.mjs$'],
  moduleNameMapper: {
    '^@/services/background/widgetSync$': '<rootDir>/src/services/background/widgetSync.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@react-native-async-storage/async-storage$': '@react-native-async-storage/async-storage/jest/async-storage-mock',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  clearMocks: true,
};
