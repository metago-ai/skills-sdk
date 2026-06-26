# @metago-ai/skills-sdk

> MetaGO Skills 官方 SDK —— 让第三方开发者用编程方式定义、验证、打包、加载自定义元构技能。

## 项目介绍

MetaGO Lifeform Kit 使用 `SKILL.md` 格式定义技能（YAML frontmatter + Markdown 正文）。`@metago-ai/skills-sdk` 是这一格式的官方 TypeScript SDK，它把「写技能」从手工编辑 Markdown 文件升级为可编程、可校验、可分发的工程化流程。

一个标准的 `SKILL.md` 长这样：

```markdown
---
name: metago-critique
description: 批判性分析技能，对方案/代码/文档进行多维度质疑
---

# 技能正文
（Markdown 内容，包含指令、步骤、输出格式等）
```

### 为什么需要它

- **格式统一**：通过类型化 API 与内置校验器，保证产出的 `SKILL.md` 始终符合规范。
- **批量生产**：用代码生成技能包，避免手写大量 Markdown 文件的重复劳动。
- **可分发**：一键生成 Kit 目录（`package.json` + `README.md` + `skills/`），便于发布与安装。
- **可加载**：运行时从多目录加载技能，支撑技能市场与插件生态。

### 在产品矩阵中的位置

本 SDK 是 MetaGO **第 4 阶段「生态基础设施」** 的核心组件：

- **向上游**：承接 Lifeform Kit 的 `SKILL.md` 标准，将其固化为可编程契约。
- **向下游**：为技能市场、第三方开发者、企业内部技能仓库提供统一入口。
- **横向**：与元构 Agent、Kit 安装器协同，形成「开发 → 校验 → 分发 → 加载」闭环。

### 完整产品矩阵

| 产品 | 类型 | 描述 |
|------|------|------|
| [Lifeform Kit](https://gitee.com/metago/metagolifeform) | 核心包 | 22核心+4Dev Kit技能，7平台支持 |
| [Dev Kit](https://gitee.com/metago/metago-dev-kit) | 垂直包 | 开发者增强包（8技能） |
| [MCP Server](https://www.npmjs.com/package/@metago-ai/mcp-server) | 平台工具 | 22 tools + 8 prompts MCP服务 |
| [CLI](https://gitee.com/metago/metago-cli) | 平台工具 | 跨平台命令行工具 |
| [Studio](https://gitee.com/metago/metago-studio) | 平台工具 | 可视化技能编排平台 |
| **Skills SDK**（本产品） | 生态基础设施 | TypeScript技能开发SDK |
| [Skills Hub](https://gitee.com/metago/metago-skills-hub) | 生态基础设施 | 技能市场 |
| [Certify](https://gitee.com/metago/metago-certify) | 生态基础设施 | 技能认证体系（Gold/Silver） |

## 安装

```bash
npm install -g @metago-ai/skills-sdk
```

要求 Node.js >= 14。

## 快速开始

```typescript
import { Skill, SkillPack, validateSkill } from '@metago-ai/skills-sdk';

// 1. 定义技能
const skill = new Skill({
  name: 'metago-my-skill',
  description: '我的第一个自定义元构技能',
  body: '# 我的技能\n\n## 步骤\n1. 执行某事',
});

// 2. 序列化为 SKILL.md
console.log(skill.toMarkdown());

// 3. 验证
const errors = skill.validate(); // 空数组表示有效
if (errors.length === 0) {
  console.log('技能格式合法');
}

// 4. 保存到磁盘
skill.save('./skills/my-skill/SKILL.md');
```

## API 文档

### Skill 类

技能的核心抽象，对应一个 `SKILL.md` 文件。

```typescript
import { Skill } from '@metago-ai/skills-sdk';

const skill = new Skill({
  name: 'metago-critique',
  description: '批判性分析技能，对方案/代码/文档进行多维度质疑',
  body: '# 批判性分析\n## 步骤\n1. ...',
  version: '1.0.0',       // 可选
  author: 'MetaGO',        // 可选
  tags: ['review', 'qa'],  // 可选
});

// 序列化为 SKILL.md 格式字符串
const markdown = skill.toMarkdown();

// 验证：返回错误数组，空数组表示有效
const errors = skill.validate();

// 保存为文件（自动创建父目录）
skill.save('./output/SKILL.md');

// 转为纯对象
const obj = skill.toJSON();
```

静态工厂方法：

```typescript
// 从 SKILL.md 文件解析
const skill = Skill.fromFile('./skills/my-skill/SKILL.md');

// 从 SKILL.md 内容字符串解析
const skill2 = Skill.fromMarkdown('---\nname: metago-x\n...\n---\n# 正文');
```

### SkillPack 类

将多个 `Skill` 聚合为可分发的 Kit。

```typescript
import { Skill, SkillPack } from '@metago-ai/skills-sdk';

const pack = new SkillPack({
  name: 'my-kit',
  version: '1.0.0',
  description: '我的自定义 Kit',
  skills: [skill1, skill2],
  author: 'MetaGO',     // 可选
  license: 'MIT',       // 可选
});

// 生成 package.json 字符串
const pkgJson = pack.generatePackageJson();

// 生成 README.md 字符串
const readme = pack.generateReadme();

// 打包为目录结构
await pack.buildToDirectory('./output/my-kit/');
// 生成:
//   ./output/my-kit/package.json
//   ./output/my-kit/README.md
//   ./output/my-kit/skills/<skill-name>/SKILL.md

// 动态追加技能
pack.addSkill(skill3);
```

### 验证器

```typescript
import { validateSkill, validateSkillFile } from '@metago-ai/skills-sdk';

// 验证技能对象
const result = validateSkill({
  name: 'metago-test',
  description: '一个合法的技能描述',
  body: '# 标题\n正文',
});
if (!result.valid) {
  console.log(result.errors); // ['name must start with metago-', ...]
}

// 验证 SKILL.md 文件
const fileResult = validateSkillFile('./path/to/SKILL.md');
console.log(fileResult.valid, fileResult.errors);
```

### 加载器

```typescript
import { loadSkills, loadSkillsFromDirectory } from '@metago-ai/skills-sdk';

// 从单个目录加载所有技能（约定：<dir>/<skill-name>/SKILL.md）
const skills = loadSkillsFromDirectory('./skills/');

// 搜索多个目录（按 name 自动去重）
const allSkills = loadSkills([
  './skills/',
  '~/.trae-cn/skills/',
  '../metago-lifeform/skills/',
]);
```

支持的目录形态：

```
形式 A（推荐）：              形式 B（平铺）：
<dir>/                        <dir>/
├── metago-a/                 └── SKILL.md
│   └── SKILL.md
└── metago-b/
    └── SKILL.md
```

### 解析器（高级）

直接操作 frontmatter，用于自定义工具链：

```typescript
import { parseSkillMarkdown, stringifySimpleYaml } from '@metago-ai/skills-sdk';

const { frontmatter, body } = parseSkillMarkdown(fileContent);
console.log(frontmatter.name, frontmatter.description);

const yaml = stringifySimpleYaml({ name: 'metago-x', description: '...' });
```

## 验证规则

| 字段 | 规则 |
| --- | --- |
| `name` | 必须以 `metago-` 开头；只含小写字母、数字、连字符 |
| `description` | 不能为空；长度 10–200 字符 |
| `body` | 不能为空；必须包含至少一个 `#` 标题（1–6 级均可） |

## 技能开发指南

### 1. 定义技能

```typescript
const skill = new Skill({
  name: 'metago-summary',          // 必须 metago- 前缀
  description: '摘要生成技能，对长文本进行结构化提炼',  // 10-200 字符
  body: `# 摘要生成

## 输入
- 原始长文本

## 步骤
1. 识别核心观点
2. 提炼关键事实
3. 输出结构化摘要

## 输出格式
\`\`\`json
{ "summary": "...", "keypoints": [...] }
\`\`\`
`,
});
```

### 2. 自检与迭代

```typescript
const errors = skill.validate();
if (errors.length > 0) {
  console.error('校验未通过：', errors);
}
```

### 3. 单独发布

```typescript
skill.save('./my-skill/SKILL.md');
```

### 4. 打包为 Kit 发布

```typescript
const pack = new SkillPack({
  name: 'my-team-kit',
  version: '1.0.0',
  description: '团队内部共享技能集合',
  skills: [skill1, skill2, skill3],
});
await pack.buildToDirectory('./dist/my-team-kit/');
```

### 命名约定

- 技能名：`metago-<领域>-<动作>`，例如 `metago-doc-review`、`metago-code-refactor`。
- Kit 名：自由命名，建议 `<org>-<kit>`，例如 `metago-qa-kit`。

## 开发

```bash
# 安装依赖
npm install

# 编译 TypeScript 到 dist/
npm run build

# 运行测试（基于 ts-node + 内置 assert）
npm test
```

### 目录结构

```
metago-skills-sdk/
├── package.json
├── README.md
├── LICENSE                # MIT
├── tsconfig.json
├── src/
│   ├── index.ts           # 导出所有 API
│   ├── types.ts           # 类型定义
│   ├── skill.ts           # Skill 类
│   ├── skill-pack.ts      # SkillPack 类
│   ├── validator.ts       # 验证逻辑
│   ├── loader.ts          # 文件加载逻辑
│   ├── parser.ts          # SKILL.md 解析器（自实现 YAML frontmatter）
│   └── generator.ts       # Markdown/package.json 生成器
└── tests/
    └── basic.test.ts      # 基础测试
```

### 设计要点

- **零运行时依赖**：YAML frontmatter 解析完全自实现，不依赖 `js-yaml` 等外部库，安装体积小、供应链风险低。
- **CommonJS 输出**：`main` 指向 `dist/index.js`，`types` 指向 `dist/index.d.ts`，兼容旧版 Node 与 CommonJS 调用方。
- **无循环依赖**：`generator.ts` 只依赖 `Skill` 类型，不反向依赖 `SkillPack`，模块图保持清晰。

## 相关链接

- **GitHub 主仓库**：https://github.com/metago-ai/metagolifeform
- **官方网站**：https://metago-d6gfw1e4rf2a5bcad-1257074864.tcloudbaseapp.com/

## 许可证

MIT © MetaGO AI
