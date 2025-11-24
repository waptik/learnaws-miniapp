# Markdown Cleanup Suggestions

## Current Markdown Structure Analysis

Based on the example provided, the markdown has:

1. **Frontmatter**: `---\nlayout: exam\n---`
2. **Title**: `# Practice Exam 6`
3. **Questions**: Numbered `1.`, `2.`, etc.
4. **Options**: Formatted as `- A.`, `- B.`, etc.
5. **Answers**: Inside `<details>` HTML tags with pattern:
   ```html
   <details markdown="1">
       <summary markdown="span">Answer</summary>
       Correct answer: D
   </details>
   ```

## Recommended Cleanup Approaches

### Option 1: Pre-processing Cleanup (Recommended)

**Strategy**: Clean the markdown content BEFORE parsing questions

**Steps**:

1. Remove frontmatter blocks
2. Remove title headers
3. Extract and normalize answer blocks
4. Clean HTML tags
5. Normalize whitespace

**Benefits**:

- Separates concerns (cleanup vs parsing)
- Easier to debug
- More maintainable
- Can handle edge cases better

**Implementation**:

```typescript
function preprocessMarkdown(content: string): string {
    // 1. Remove frontmatter
    content = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/m, "");

    // 2. Remove title headers
    content = content.replace(/^#+\s*Practice Exam \d+\s*$/gm, "");

    // 3. Extract answers from <details> tags and normalize format
    content = content.replace(
        /<details[^>]*>[\s\S]*?<summary[^>]*>Answer<\/summary>[\s\S]*?Correct answer:\s*([A-F](?:,\s*[A-F])*)[\s\S]*?<\/details>/gi,
        "\nCorrect answer: $1\n",
    );

    // 4. Remove any remaining HTML tags
    content = content.replace(/<[^>]*>/g, "");

    // 5. Normalize whitespace (multiple newlines to double)
    content = content.replace(/\n{3,}/g, "\n\n");

    return content;
}
```

### Option 2: Improved Regex Patterns

**Strategy**: Make regex patterns more robust and handle edge cases

**Key Improvements**:

- Better boundary detection
- Handle variations in spacing
- More flexible option extraction
- Better answer extraction

**Implementation**:

```typescript
// More robust option extraction
function extractOptionsImproved(block: string): Record<string, string> {
    const options: Record<string, string> = {};

    // Match options with more flexible patterns
    // Handles: "- A. text", " - A. text", "-A. text"
    const optionPattern =
        /[-•]\s*([A-F])\.\s+(.*?)(?=\n\s*[-•]\s*[A-F]\.|Correct answer:|$)/gs;

    let match;
    while ((match = optionPattern.exec(block)) !== null) {
        const letter = match[1];
        const text = match[2].trim();
        options[letter] = cleanText(text);
    }

    return options;
}

// Better answer extraction
function extractCorrectAnswerImproved(block: string): string[] | null {
    // Try multiple patterns
    const patterns = [
        /Correct answer:\s*([A-F](?:,\s*[A-F])*)/i,
        /Answer:\s*([A-F](?:,\s*[A-F])*)/i,
        /<summary[^>]*>Answer<\/summary>[\s\S]*?Correct answer:\s*([A-F](?:,\s*[A-F])*)/i,
    ];

    for (const pattern of patterns) {
        const match = block.match(pattern);
        if (match) {
            return match[1].split(",").map((a) => a.trim());
        }
    }

    return null;
}
```

### Option 3: State Machine Parser (Most Robust)

**Strategy**: Parse markdown character-by-character or line-by-line using state
machine

**Benefits**:

- Most reliable for complex formats
- Handles edge cases naturally
- Easy to extend

**Implementation**:

```typescript
type ParserState =
    | "FRONTMATTER"
    | "HEADER"
    | "QUESTION_NUMBER"
    | "QUESTION_TEXT"
    | "OPTIONS"
    | "ANSWER";

function parseWithStateMachine(content: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    let state: ParserState = "FRONTMATTER";
    let currentQuestion: Partial<ParsedQuestion> = {};
    let currentOption: string | null = null;

    const lines = content.split("\n");

    for (const line of lines) {
        // State transitions based on line content
        if (line.match(/^---/)) {
            state = state === "FRONTMATTER" ? "HEADER" : state;
            continue;
        }

        if (line.match(/^#+\s*Practice Exam/)) {
            state = "QUESTION_NUMBER";
            continue;
        }

        if (line.match(/^\d+\./)) {
            // Save previous question if exists
            if (currentQuestion.text) {
                questions.push(currentQuestion as ParsedQuestion);
            }
            // Start new question
            currentQuestion = { options: [], correctAnswers: [] };
            state = "QUESTION_TEXT";
            // Extract question number and start of text
            const match = line.match(/^\d+\.\s+(.*)/);
            if (match) {
                currentQuestion.text = match[1].trim();
            }
            continue;
        }

        if (line.match(/^[-•]\s*[A-F]\./)) {
            state = "OPTIONS";
            // Extract option
            const match = line.match(/^[-•]\s*([A-F])\.\s+(.*)/);
            if (match && currentQuestion.options) {
                currentQuestion.options.push(cleanText(match[2]));
            }
            continue;
        }

        if (line.match(/Correct answer:/i)) {
            state = "ANSWER";
            const match = line.match(
                /Correct answer:\s*([A-F](?:,\s*[A-F])*)/i,
            );
            if (match && currentQuestion.correctAnswers) {
                currentQuestion.correctAnswers = match[1].split(",").map((a) =>
                    a.trim()
                );
            }
            continue;
        }

        // Handle continuation of current state
        if (state === "QUESTION_TEXT" && line.trim()) {
            currentQuestion.text += " " + line.trim();
        }
    }

    // Don't forget last question
    if (currentQuestion.text) {
        questions.push(currentQuestion as ParsedQuestion);
    }

    return questions;
}
```

### Option 4: Hybrid Approach (Best Balance)

**Strategy**: Combine pre-processing + improved regex

**Implementation**:

```typescript
function parseQuestionsHybrid(
    content: string,
    sourceName: string,
): ParsedQuestion[] {
    // Step 1: Pre-process
    content = preprocessMarkdown(content);

    // Step 2: Split into question blocks
    const questionBlocks = content.split(/\n(?=\d+\.)/);

    // Step 3: Parse each block with improved patterns
    return questionBlocks.map((block) => parseQuestionBlock(block, sourceName))
        .filter((q) => q !== null);
}
```

## Recommended Solution: Option 1 + Option 2 (Hybrid)

**Why**:

- Pre-processing handles structural cleanup (frontmatter, HTML)
- Improved regex handles content extraction
- Easier to maintain and debug
- Good balance of simplicity and robustness

## Specific Cleanup Functions Needed

### 1. Remove Frontmatter

```typescript
function removeFrontmatter(content: string): string {
    return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/m, "");
}
```

### 2. Remove Title Headers

```typescript
function removeHeaders(content: string): string {
    return content.replace(/^#+\s*Practice Exam \d+\s*$/gm, "");
}
```

### 3. Extract Answers from HTML

```typescript
function extractAnswersFromHTML(content: string): string {
    return content.replace(
        /<details[^>]*>[\s\S]*?<summary[^>]*>Answer<\/summary>[\s\S]*?Correct answer:\s*([A-F](?:,\s*[A-F])*)[\s\S]*?<\/details>/gi,
        "\nCorrect answer: $1\n",
    );
}
```

### 4. Clean HTML Tags

```typescript
function removeHTMLTags(content: string): string {
    return content.replace(/<[^>]*>/g, "");
}
```

### 5. Normalize Whitespace

```typescript
function normalizeWhitespace(content: string): string {
    // Multiple newlines to double
    content = content.replace(/\n{3,}/g, "\n\n");
    // Multiple spaces to single
    content = content.replace(/[ \t]+/g, " ");
    return content.trim();
}
```

## Complete Pre-processing Function

```typescript
function preprocessMarkdown(content: string): string {
    // 1. Remove frontmatter
    content = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/m, "");

    // 2. Remove title headers
    content = content.replace(/^#+\s*Practice Exam \d+\s*$/gm, "");

    // 3. Extract answers from HTML details tags
    content = content.replace(
        /<details[^>]*>[\s\S]*?<summary[^>]*>Answer<\/summary>[\s\S]*?Correct answer:\s*([A-F](?:,\s*[A-F])*)[\s\S]*?<\/details>/gi,
        "\nCorrect answer: $1\n",
    );

    // 4. Remove any remaining HTML tags
    content = content.replace(/<[^>]*>/g, "");

    // 5. Normalize whitespace
    content = content.replace(/\n{3,}/g, "\n\n");
    content = content.replace(/[ \t]+/g, " ");

    return content.trim();
}
```

## Testing Strategy

1. **Unit tests** for each cleanup function
2. **Integration tests** with sample markdown
3. **Edge case tests**:
   - Questions with no options
   - Questions with extra whitespace
   - Questions with HTML in text
   - Questions with malformed answers

## Implementation Priority

1. ✅ **High Priority**: Pre-processing cleanup (removes HTML, frontmatter)
2. ✅ **High Priority**: Improved answer extraction (handles HTML details)
3. ⚠️ **Medium Priority**: Better option extraction (handles edge cases)
4. ⚠️ **Low Priority**: State machine parser (if regex fails)
