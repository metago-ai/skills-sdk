/**
 * MetaGO Skills SDK - 验证器
 * 校验技能定义是否符合 SKILL.md 规范
 *
 * 验证规则：
 *   - name: 必须以 metago- 开头，只含小写字母、数字、连字符
 *   - description: 不能为空，长度 10-200 字符
 *   - body: 不能为空，必须包含至少一个 # 标题
 */

import * as fs from 'fs';
import { SkillDefinition, ValidationResult } from './types';
import { parseSkillMarkdown } from './parser';

/** 名称正则：以 metago- 开头，只含小写字母、数字、连字符 */
const NAME_PATTERN = /^metago-[a-z0-9-]+$/;

/** 标题正则：行首 1-6 个 # 后接空格与非空白字符 */
const HEADING_PATTERN = /^#{1,6}\s+\S/m;

/** description 最小长度 */
const DESCRIPTION_MIN = 10;
/** description 最大长度 */
const DESCRIPTION_MAX = 200;

/**
 * 验证技能定义对象
 *
 * @param skill 技能定义
 * @returns 验证结果（valid 为 true 表示通过）
 */
export function validateSkill(skill: SkillDefinition): ValidationResult {
  const errors: string[] = [];

  // 验证 name
  if (!skill.name || typeof skill.name !== 'string') {
    errors.push('name 不能为空');
  } else {
    if (!skill.name.startsWith('metago-')) {
      errors.push('name 必须以 metago- 开头');
    }
    if (!NAME_PATTERN.test(skill.name)) {
      errors.push('name 只能包含小写字母、数字、连字符，且以 metago- 开头');
    }
  }

  // 验证 description
  if (!skill.description || typeof skill.description !== 'string') {
    errors.push('description 不能为空');
  } else {
    if (skill.description.length < DESCRIPTION_MIN) {
      errors.push(
        `description 长度不能少于 ${DESCRIPTION_MIN} 字符（当前 ${skill.description.length}）`
      );
    }
    if (skill.description.length > DESCRIPTION_MAX) {
      errors.push(
        `description 长度不能超过 ${DESCRIPTION_MAX} 字符（当前 ${skill.description.length}）`
      );
    }
  }

  // 验证 body
  if (!skill.body || typeof skill.body !== 'string') {
    errors.push('body 不能为空');
  } else {
    if (skill.body.trim().length === 0) {
      errors.push('body 不能为空');
    } else if (!HEADING_PATTERN.test(skill.body)) {
      errors.push('body 必须包含至少一个 # 标题');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 验证 SKILL.md 文件
 *
 * @param filePath SKILL.md 文件路径
 * @returns 验证结果
 */
export function validateSkillFile(filePath: string): ValidationResult {
  try {
    if (!fs.existsSync(filePath)) {
      return { valid: false, errors: [`文件不存在: ${filePath}`] };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, body } = parseSkillMarkdown(content);

    return validateSkill({
      name: String(frontmatter.name ?? ''),
      description: String(frontmatter.description ?? ''),
      body,
    });
  } catch (err) {
    return {
      valid: false,
      errors: [
        `读取/解析文件失败: ${err instanceof Error ? err.message : String(err)}`,
      ],
    };
  }
}
