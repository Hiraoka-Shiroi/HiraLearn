export interface ValidationResult {
  isValid: boolean;
  feedback: string;
  type: 'success' | 'hint' | 'error';
}

export const analyzeCode = (userCode: string, _task: string, solutionRegex: RegExp[]): ValidationResult => {
  const normalizedCode = userCode.replace(/\s+/g, ' ').trim();

  // Basic empty check
  if (!normalizedCode || normalizedCode.length < 5) {
    return {
      isValid: false,
      feedback: "Sensei is waiting for your brushstrokes. The canvas is still empty.",
      type: 'hint'
    };
  }

  // Count how many rules passed
  const passedRules = solutionRegex.filter(regex => regex.test(userCode)).length;
  const totalRules = solutionRegex.length;

  if (passedRules === totalRules) {
    return {
      isValid: true,
      feedback: "Excellent! Your code is clean and structured. The path opens further.",
      type: 'success'
    };
  }

  // Heuristic feedback based on common mistakes
  if (passedRules > 0 && passedRules < totalRules) {
    if (!/<\/.*?>/.test(userCode)) {
      return {
        isValid: false,
        feedback: "You've started the journey, but forgotten to close the door. Every opening tag needs a closing tag.",
        type: 'hint'
      };
    }
    return {
      isValid: false,
      feedback: `You are close! ${passedRules}/${totalRules} parts of the structure are correct. Look closely at the instructions again.`,
      type: 'hint'
    };
  }

  return {
    isValid: false,
    feedback: "Not quite what we're looking for. Remember: in HTML, order and nesting are everything. Try to follow the example.",
    type: 'error'
  };
};

export const getSenseiResponse = (message: string, currentCode: string): string => {
  const msg = message.toLowerCase();

  if (msg.includes('help') || msg.includes('подскажи') || msg.includes('помоги')) {
    return "I am here. Look at your code - HTML is like a house. Tags are the walls. Have you built your walls correctly?";
  }

  if (msg.includes('solution') || msg.includes('ответ') || msg.includes('решение')) {
    return "The path is found by walking, not by jumping. I cannot give you the answer, but I can tell you that you are missing a tag.";
  }

  if (currentCode.length > 0) {
    return "Your code looks interesting. Try to check it using the 'Check Solution' button, and I will give you more specific feedback.";
  }

  return "Patience and practice. What is your question about this lesson?";
};
