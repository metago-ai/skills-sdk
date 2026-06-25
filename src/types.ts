/**
 * MetaGO Skills SDK - 类型定义
 * 定义技能、验证结果、解析结果等核心数据结构
 */

/**
 * 技能定义原始数据
 * 与 SKILL.md 的 frontmatter + 正文一一对应
 */
export interface SkillDefinition {
  /** 技能名称，必须以 metago- 开头，只含小写字母、数字、连字符 */
  name: string;
  /** 技能描述，长度 10-200 字符 */
  description: string;
  /** 技能正文（Markdown），必须包含至少一个 # 标题 */
  body: string;
  /** 可选版本号 */
  version?: string;
  /** 可选作者信息 */
  author?: string;
  /** 可选标签数组 */
  tags?: string[];
}

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否验证通过 */
  valid: boolean;
  /** 错误信息数组，空数组表示通过 */
  errors: string[];
}

/**
 * 解析后的 SKILL.md 结构
 */
export interface ParsedSkillFile {
  /** frontmatter 元数据（YAML 解析为对象） */
  frontmatter: Record<string, unknown>;
  /** Markdown 正文 */
  body: string;
}
