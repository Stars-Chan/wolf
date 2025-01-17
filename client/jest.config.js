export default {
  preset: "ts-jest", // 使用 ts-jest 处理 TypeScript
  testEnvironment: "node", // 测试环境为 Node.js
  testMatch: ["**/?(*.)+(spec|test).[tj]s?(x)"], // 匹配测试文件
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"], // 支持的文件扩展名
  transform: {
    "^.+\\.tsx?$": "ts-jest", // 使用 ts-jest 转换 TypeScript 文件
  },
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.app.json", // 确保指向正确的 tsconfig 文件
      useESM: true, // 如果使用 ESM，启用此选项
    },
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1", // 将 .js 文件映射到 .ts 文件
  },
};
