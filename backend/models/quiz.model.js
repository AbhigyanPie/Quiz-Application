const { v4: uuidv4 } = require('uuid');

/**
 * Quiz Model
 * Represents a quiz with enhanced validation and utilities
 */
class Quiz {
  constructor(title) {
    this.id = uuidv4();
    this.title = title.trim();
    this.questions = [];
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Add a question to the quiz
   * @param {Question} question - Question instance to add
   */
  addQuestion(question) {
    if (!(question instanceof Question)) {
      throw new Error('Invalid question object');
    }
    this.questions.push(question);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Get questions without revealing correct answers
   * Used when users take the quiz
   * @returns {Array} Questions with options but without isCorrect flags
   */
  getQuestionsWithoutAnswers() {
    return this.questions.map(question => question.getPublicView());
  }

  /**
   * Get full quiz details for admin/creator view
   * @returns {Object} Complete quiz data
   */
  getFullDetails() {
    return {
      id: this.id,
      title: this.title,
      questionCount: this.questions.length,
      questions: this.questions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Get quiz summary without questions
   * @returns {Object} Quiz metadata
   */
  getSummary() {
    return {
      id: this.id,
      title: this.title,
      questionCount: this.questions.length,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Find question by ID
   * @param {string} questionId - Question ID
   * @returns {Question|null} Question instance or null
   */
  findQuestionById(questionId) {
    return this.questions.find(q => q.id === questionId) || null;
  }

  /**
   * Remove question by ID
   * @param {string} questionId - Question ID
   * @returns {boolean} True if removed
   */
  removeQuestion(questionId) {
    const index = this.questions.findIndex(q => q.id === questionId);
    if (index !== -1) {
      this.questions.splice(index, 1);
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }
}

/**
 * Question Model
 * Enhanced with better validation and answer checking logic
 * Supports: single_choice, multiple_choice, text
 */
class Question {
  constructor(text, type = 'single_choice') {
    this.id = uuidv4();
    this.text = text.trim();
    this.type = type;
    this.options = [];
    this.createdAt = new Date().toISOString();
  }

  /**
   * Add an option to the question
   * @param {string} text - Option text
   * @param {boolean} isCorrect - Whether this option is correct
   * @returns {Object} The created option
   */
  addOption(text, isCorrect = false) {
    if (!text || typeof text !== 'string') {
      throw new Error('Option text must be a non-empty string');
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      throw new Error('Option text cannot be empty after trimming');
    }

    const option = {
      id: uuidv4(),
      text: trimmedText,
      isCorrect: Boolean(isCorrect)
    };
    
    this.options.push(option);
    return option;
  }

  /**
   * Get all correct option IDs
   * @returns {Array<string>} Array of correct option IDs
   */
  getCorrectOptionIds() {
    return this.options
      .filter(option => option.isCorrect)
      .map(option => option.id);
  }

  /**
   * Check if submitted answer is correct
   * Enhanced logic with better handling of edge cases
   * @param {Array<string>} selectedOptionIds - IDs of selected options
   * @returns {boolean} Whether the answer is correct
   */
  isAnswerCorrect(selectedOptionIds) {
    // Input validation
    if (!Array.isArray(selectedOptionIds)) {
      return false;
    }

    // Remove duplicates and filter out empty values
    const uniqueSelected = [...new Set(selectedOptionIds.filter(id => id))];
    const correctIds = this.getCorrectOptionIds();
    
    // No correct answers defined - invalid question
    if (correctIds.length === 0) {
      return false;
    }

    // No answer provided
    if (uniqueSelected.length === 0) {
      return false;
    }

    // Validate all selected options exist
    const allOptionsExist = uniqueSelected.every(id => 
      this.options.some(opt => opt.id === id)
    );
    if (!allOptionsExist) {
      return false;
    }

    // Type-specific validation
    switch (this.type) {
      case 'single_choice':
        return this.validateSingleChoice(uniqueSelected, correctIds);
      
      case 'multiple_choice':
        return this.validateMultipleChoice(uniqueSelected, correctIds);
      
      case 'text':
        return this.validateTextChoice(uniqueSelected, correctIds);
      
      default:
        return false;
    }
  }

  /**
   * Validate single choice answer
   * @private
   */
  validateSingleChoice(selected, correct) {
    // Must select exactly one option
    if (selected.length !== 1) {
      return false;
    }
    // Selected option must be the correct one
    return correct.includes(selected[0]);
  }

  /**
   * Validate multiple choice answer
   * @private
   */
  validateMultipleChoice(selected, correct) {
    // Must have same count
    if (selected.length !== correct.length) {
      return false;
    }
    
    // All selected must be correct
    const allSelectedCorrect = selected.every(id => correct.includes(id));
    
    // All correct must be selected
    const allCorrectSelected = correct.every(id => selected.includes(id));
    
    return allSelectedCorrect && allCorrectSelected;
  }

  /**
   * Validate text-based answer
   * @private
   */
  validateTextChoice(selected, correct) {
    // For text questions, any correct answer is acceptable
    return selected.some(id => correct.includes(id));
  }

  /**
   * Validate question structure and constraints
   * @throws {Error} If question is invalid
   */
  validate() {
    // Text validation
    if (!this.text || this.text.trim().length === 0) {
      throw new Error('Question text cannot be empty');
    }

    // Options validation
    if (!Array.isArray(this.options) || this.options.length === 0) {
      throw new Error('At least one option is required');
    }

    // Correct answers validation
    const correctOptions = this.options.filter(opt => opt.isCorrect);
    
    if (correctOptions.length === 0) {
      throw new Error('At least one correct answer is required');
    }

    // Type-specific validation
    this.validateByType(correctOptions);

    return true;
  }

  /**
   * Validate based on question type
   * @private
   */
  validateByType(correctOptions) {
    switch (this.type) {
      case 'single_choice':
        if (correctOptions.length !== 1) {
          throw new Error('Single choice questions can only have one correct answer');
        }
        if (this.options.length < 2) {
          throw new Error('Single choice questions must have at least 2 options');
        }
        break;

      case 'multiple_choice':
        if (correctOptions.length < 2) {
          throw new Error('Multiple choice questions must have at least 2 correct answers');
        }
        if (correctOptions.length === this.options.length) {
          throw new Error('Multiple choice questions must have at least one incorrect option');
        }
        if (this.options.length < 3) {
          throw new Error('Multiple choice questions must have at least 3 options');
        }
        break;

      case 'text':
        if (this.text.length > 300) {
          throw new Error('Text-based question cannot exceed 300 characters');
        }
        break;

      default:
        throw new Error(`Invalid question type: ${this.type}`);
    }
  }

  /**
   * Get question details without correct answers
   * Used when displaying quiz to users
   * @returns {Object} Question data without correct answer flags
   */
  getPublicView() {
    return {
      id: this.id,
      text: this.text,
      type: this.type,
      options: this.options.map(opt => ({
        id: opt.id,
        text: opt.text
      }))
    };
  }

  /**
   * Get complete question data including correct answers
   * Used for admin view and grading
   * @returns {Object} Complete question data
   */
  getFullDetails() {
    return {
      id: this.id,
      text: this.text,
      type: this.type,
      options: this.options,
      correctOptionIds: this.getCorrectOptionIds(),
      createdAt: this.createdAt
    };
  }
}

module.exports = { Quiz, Question };