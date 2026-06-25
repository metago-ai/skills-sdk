/**
 * MetaGO Skills SDK - 主入口
 * 导出所有公共 API
 *
 * 使用示例：
 *   import { Skill, SkillPack, validateSkill, loadSkills } from '@metago-ai/skills-sdk';
 */

// 核心类
export { Skill } from './skill';
export { SkillPack, SkillPackOptions } from './skill-pack';

// 验证器
export { validateSkill, validateSkillFile } from './validator';

// 加载器
export { loadSkills, loadSkillsFromDirectory } from './loader';

// 解析器
export {
  parseSkillMarkdown,
  parseSimpleYaml,
  stringifySimpleYaml,
} from './parser';

// 生成器
export { generatePackageJson, generateReadme, GenerateOptions } from './generator';

// 类型定义
export {
  SkillDefinition,
  ValidationResult,
  ParsedSkillFile,
} from './types';
