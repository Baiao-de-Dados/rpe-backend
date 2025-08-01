module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/../test/jest-setup.ts'],
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/$1',
    },
};
