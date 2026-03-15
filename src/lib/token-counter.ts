// Estimates token count for Lua source code
// Counts identifiers, keywords, operators, string literals, and numbers

const LUA_KEYWORDS = new Set([
  "and", "break", "do", "else", "elseif", "end", "false", "for",
  "function", "goto", "if", "in", "local", "nil", "not", "or",
  "repeat", "return", "then", "true", "until", "while",
]);

export function countTokens(code: string): number {
  let count = 0;
  let i = 0;
  const len = code.length;

  while (i < len) {
    const c = code[i];

    // Skip whitespace
    if (c === " " || c === "\t" || c === "\r" || c === "\n") {
      i++;
      continue;
    }

    // Line comment
    if (c === "-" && code[i + 1] === "-") {
      if (code[i + 2] === "[" && code[i + 3] === "[") {
        // Block comment
        i += 4;
        while (i < len && !(code[i] === "]" && code[i + 1] === "]")) i++;
        i += 2;
      } else {
        while (i < len && code[i] !== "\n") i++;
      }
      continue;
    }

    // String
    if (c === '"' || c === "'") {
      const q = c;
      i++;
      while (i < len && code[i] !== q) {
        if (code[i] === "\\") i++;
        i++;
      }
      i++;
      count++;
      continue;
    }

    // Long string
    if (c === "[" && code[i + 1] === "[") {
      i += 2;
      while (i < len && !(code[i] === "]" && code[i + 1] === "]")) i++;
      i += 2;
      count++;
      continue;
    }

    // Number
    if (c >= "0" && c <= "9") {
      while (i < len && /[\w.]/.test(code[i])) i++;
      count++;
      continue;
    }

    // Identifier or keyword
    if (/[a-zA-Z_]/.test(c)) {
      const start = i;
      while (i < len && /\w/.test(code[i])) i++;
      const word = code.slice(start, i);
      if (!LUA_KEYWORDS.has(word)) count++;
      else count++;
      continue;
    }

    // Operator / punctuation
    count++;
    i++;
  }

  return count;
}
