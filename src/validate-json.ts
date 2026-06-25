/**
 * Detect duplicate object keys in the *raw text* of a JSON document.
 *
 * `JSON.parse` silently keeps only the last of any duplicate keys, so a
 * hand-introduced duplicate — two delegate records sharing an abbreviation, say
 * — is dropped before any structured validation can observe it. A `JSON.parse`
 * reviver cannot recover it either: the reviver walks an already-built,
 * already-deduplicated value. The only place the duplicate is still visible is
 * the source text, so this scans it directly. It backs the permanent test that
 * guards the hand-maintained `src/data/*.json` files (see test/data-json.test.ts).
 */

/** An open `{ … }` being scanned: the keys seen so far and whether the next string is a key. */
interface ObjectFrame {
  seen: Set<string>;
  expectKey: boolean;
}

/**
 * Return each key that occurs more than once *within the same object* (at any
 * nesting depth), in the order the duplicates are encountered; an empty array
 * means every object has distinct keys. Keys are compared by their decoded
 * value, matching how `JSON.parse` interprets them, so `"a"` collides with
 * `"a"`.
 *
 * The input is assumed to be valid JSON (these run over files `JSON.parse`
 * already accepts). The scanner tracks only what duplicate detection needs —
 * object nesting and key-vs-value position — and is deliberately lenient about
 * everything else (numbers, booleans, null, and whitespace carry no structural
 * characters, so they are simply skipped).
 */
export function findDuplicateJsonKeys(text: string): string[] {
  const duplicates: string[] = [];
  // One entry per open `{`/`[`. Object frames track key state; `null` marks an
  // array frame, whose elements are never keys.
  const stack: (ObjectFrame | null)[] = [];

  for (let i = 0; i < text.length; i++) {
    switch (text.charCodeAt(i)) {
      case 0x7b: // "{" — enter an object; its first member is a key.
        stack.push({ seen: new Set(), expectKey: true });
        break;
      case 0x5b: // "[" — enter an array; elements are not keys.
        stack.push(null);
        break;
      case 0x7d: // "}"
      case 0x5d: // "]"
        stack.pop();
        break;
      case 0x3a: // ":" — separates a key from its value; nothing to track.
        break;
      case 0x2c: { // "," — in an object, the next member begins with a key.
        const frame = stack[stack.length - 1];
        if (frame) frame.expectKey = true;
        break;
      }
      case 0x22: { // '"' — a string; consume it whole, then classify it.
        const { value, end } = readString(text, i);
        i = end; // jump to the closing quote; the loop's i++ steps past it.
        const frame = stack[stack.length - 1];
        if (frame && frame.expectKey) {
          if (frame.seen.has(value)) duplicates.push(value);
          else frame.seen.add(value);
          frame.expectKey = false; // what follows the `:` is the value, not a key.
        }
        break;
      }
    }
  }

  return duplicates;
}

/**
 * Read the JSON string whose opening quote is at `start`, returning its decoded
 * value and the index of the closing quote. The JSON escapes (`\" \\ \/ \b \f
 * \n \r \t` and `\uXXXX`) are decoded so the value matches `JSON.parse`'s, which
 * is what makes key comparison correct.
 */
function readString(text: string, start: number): { value: string; end: number } {
  let value = "";
  let i = start + 1; // skip the opening quote
  for (; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') break; // closing quote
    if (ch !== "\\") {
      value += ch;
      continue;
    }
    // Escape sequence: consume the backslash and decode the following char(s).
    const esc = text[++i];
    switch (esc) {
      case '"': value += '"'; break;
      case "\\": value += "\\"; break;
      case "/": value += "/"; break;
      case "b": value += "\b"; break;
      case "f": value += "\f"; break;
      case "n": value += "\n"; break;
      case "r": value += "\r"; break;
      case "t": value += "\t"; break;
      case "u": // \uXXXX — one UTF-16 code unit (surrogate pairs decode to the same units JSON.parse keeps).
        value += String.fromCharCode(parseInt(text.slice(i + 1, i + 5), 16));
        i += 4;
        break;
      default: // not a valid JSON escape; input is assumed valid, so this is defensive only.
        value += esc ?? "";
    }
  }
  return { value, end: i };
}
