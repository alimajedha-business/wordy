import { Prompt, PromptType, Difficulty } from './types';

const VALID_TYPES: PromptType[] = ['WORD', 'PHRASE', 'PROVERB'];
const VALID_DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

export interface PromptValidationError {
  promptId: string;
  field: string;
  message: string;
}

/**
 * Validates a single prompt according to spec rules.
 */
export function validatePrompt(prompt: Prompt): PromptValidationError[] {
  const errors: PromptValidationError[] = [];

  if (!prompt.id || !prompt.id.trim()) {
    errors.push({
      promptId: prompt.id || 'unknown',
      field: 'id',
      message: 'شناسه کلمه نباید خالی باشد.',
    });
  }

  if (!prompt.text || !prompt.text.trim()) {
    errors.push({
      promptId: prompt.id,
      field: 'text',
      message: 'متن کلمه نباید خالی باشد.',
    });
  }

  if (!VALID_TYPES.includes(prompt.type)) {
    errors.push({
      promptId: prompt.id,
      field: 'type',
      message: `نوع کلمه نامعتبر است: ${prompt.type}`,
    });
  }

  if (!VALID_DIFFICULTIES.includes(prompt.difficulty)) {
    errors.push({
      promptId: prompt.id,
      field: 'difficulty',
      message: `سطح سختی نامعتبر است: ${prompt.difficulty}`,
    });
  }

  if (!prompt.allowedRounds || prompt.allowedRounds.length === 0) {
    errors.push({
      promptId: prompt.id,
      field: 'allowedRounds',
      message: 'مراحل مجاز کلمه باید حداقل یک مرحله را شامل شود.',
    });
  } else {
    // Proverb is forbidden in Round 1
    if (prompt.type === 'PROVERB' && prompt.allowedRounds.includes(1)) {
      errors.push({
        promptId: prompt.id,
        field: 'allowedRounds',
        message: 'ضرب‌المثل هرگز نمی‌تواند در مرحله ۱ مجاز باشد.',
      });
    }

    // Allowed rounds must be 1, 2, or 3
    for (const r of prompt.allowedRounds) {
      if (![1, 2, 3].includes(r)) {
        errors.push({
          promptId: prompt.id,
          field: 'allowedRounds',
          message: `شماره مرحله نامعتبر است: ${r}`,
        });
      }
    }
  }

  return errors;
}

/**
 * Validates an entire prompt bank for internal consistency.
 */
export function validatePromptBank(bank: Prompt[]): {
  isValid: boolean;
  errors: PromptValidationError[];
} {
  const errors: PromptValidationError[] = [];
  const seenIds = new Set<string>();
  const seenTexts = new Set<string>();

  for (const prompt of bank) {
    const promptErrors = validatePrompt(prompt);
    errors.push(...promptErrors);

    if (seenIds.has(prompt.id)) {
      errors.push({
        promptId: prompt.id,
        field: 'id',
        message: `شناسه کلمه تکراری است: ${prompt.id}`,
      });
    }
    seenIds.add(prompt.id);

    const normalizedText = prompt.text?.trim().toLowerCase();
    if (normalizedText) {
      if (seenTexts.has(normalizedText)) {
        errors.push({
          promptId: prompt.id,
          field: 'text',
          message: `متن کلمه تکراری است: ${prompt.text}`,
        });
      }
      seenTexts.add(normalizedText);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
