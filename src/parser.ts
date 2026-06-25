/**
 * MetaGO Skills SDK - SKILL.md 解析器
 * 自实现 YAML frontmatter 解析，不依赖外部 YAML 库
 *
 * 支持特性：
 *   - frontmatter 边界识别（--- ... ---）
 *   - 简单 key: value 标量
 *   - 块式数组（- item）
 *   - 内联数组（[a, b, c]）
 *   - 字符串/数字/布尔/null 标量
 *   - BOM 头容忍
 */

import { ParsedSkillFile } from './types';

/** frontmatter 分隔符 */
const FRONTMATTER_DELIMITER = '---';

/**
 * 解析 SKILL.md 内容
 * 格式：---\n<yaml>\n---\n<markdown body>
 *
 * @param content 文件内容
 * @returns 解析结果，包含 frontmatter 与 body
 */
export function parseSkillMarkdown(content: string): ParsedSkillFile {
  // 容忍 UTF-8 BOM 头
  const normalized = content.replace(/^\uFEFF/, '');
  const trimmed = normalized.trimStart();

  // 不以 --- 开头则视为无 frontmatter
  if (!trimmed.startsWith(FRONTMATTER_DELIMITER)) {
    return { frontmatter: {}, body: normalized };
  }

  // 跳过起始 ---
  const afterFirst = trimmed.slice(FRONTMATTER_DELIMITER.length);

  // 查找结束 ---（必须独占一行）
  const endMarker = '\n' + FRONTMATTER_DELIMITER;
  const endIdx = afterFirst.indexOf(endMarker);
  if (endIdx === -1) {
    // 未闭合，整体作为 body
    return { frontmatter: {}, body: normalized };
  }

  const yamlContent = afterFirst.slice(0, endIdx);
  // 跳过结束 --- 及其所在行
  const afterEnd = afterFirst.slice(endIdx + endMarker.length);
  // 去除 body 前导换行
  const body = afterEnd.replace(/^[\r\n]+/, '');

  return { frontmatter: parseSimpleYaml(yamlContent), body };
}

/**
 * 解析简单 YAML（仅支持 key: value 与数组，足够覆盖 SKILL.md 场景）
 *
 * @param yamlContent YAML 字符串
 * @returns 解析后的对象
 */
export function parseSimpleYaml(yamlContent: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yamlContent.split(/\r?\n/);

  let currentKey = '';
  let inArray = false;
  const arrayBuffer: unknown[] = [];

  // 刷新当前累积的数组到结果
  const flush = (): void => {
    if (inArray && currentKey) {
      result[currentKey] = arrayBuffer.slice();
      arrayBuffer.length = 0;
      inArray = false;
      currentKey = '';
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    // 跳过空行与注释
    if (!line || line.startsWith('#')) continue;

    // 块式数组项：- value
    if (line.startsWith('- ')) {
      if (inArray) {
        arrayBuffer.push(parseScalar(line.slice(2).trim()));
      }
      continue;
    }

    // key: value
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    // 进入新的 key 前，先刷新之前的数组
    flush();

    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();

    if (value === '') {
      // 值为空：可能为数组开始
      currentKey = key;
      inArray = true;
      arrayBuffer.length = 0;
    } else {
      result[key] = parseScalar(value);
    }
  }

  flush();
  return result;
}

/**
 * 解析标量值
 * 支持：内联数组、引号字符串、布尔、null、整数、浮点数、裸字符串
 *
 * @param raw 原始字符串
 * @returns 解析后的值
 */
function parseScalar(raw: string): unknown {
  // 内联数组 [a, b, c]
  if (raw.startsWith('[') && raw.endsWith(']')) {
    const inner = raw.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((s) => parseScalar(s.trim()));
  }
  // 引号字符串
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }
  // 布尔
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  // null
  if (raw === 'null' || raw === '~') return null;
  // 整数
  if (/^-?\d+$/.test(raw)) return parseInt(raw, 10);
  // 浮点数
  if (/^-?\d+\.\d+$/.test(raw)) return parseFloat(raw);
  // 裸字符串
  return raw;
}

/**
 * 将对象序列化为简单 YAML（块式风格）
 *
 * @param obj 对象
 * @returns YAML 字符串
 */
export function stringifySimpleYaml(obj: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) lines.push(`  - ${formatScalar(item)}`);
      }
    } else {
      lines.push(`${key}: ${formatScalar(value)}`);
    }
  }
  return lines.join('\n');
}

/**
 * 判断字符串是否需要加引号
 */
function needsQuotes(s: string): boolean {
  if (s === '') return true;
  const first = s.charAt(0);
  // 以特殊指示符开头时需加引号
  const startSpecial = ':#-&*?|>%@`"\'{}[],'.includes(first) || first === '-';
  if (startSpecial) return true;
  // 含换行
  if (s.includes('\n') || s.includes('\r')) return true;
  // 含 ": " 或 " #" 会造成 YAML 歧义
  if (s.includes(': ') || s.includes(' #')) return true;
  return false;
}

/**
 * 格式化标量为 YAML 字符串
 */
function formatScalar(value: unknown): string {
  if (typeof value === 'string') {
    if (needsQuotes(value)) {
      return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  return String(value);
}
