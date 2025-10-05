const { Quiz, Question } = require('../models/quiz.model');

/**
 * QuizService
 * Enhanced business logic layer with comprehensive validation
 * and error handling
 */
class QuizService {
  constructor() {
    // In-memory storage (use database in production)
    this.quizzes = new Map();
  }

  /**
   * Create a new quiz with validation
   * @param {string} title - Quiz title
   * @returns {Quiz} Created quiz instance
   * @throws {Error} If validation fails
   */
  createQuiz(title) {
    // Input validation
    if (title === undefined || title === null) {
      throw new Error('Quiz title is required');
    }

    if (typeof title !== 'string') {
      throw new Error('Quiz title must be a string');
    }

    const trimmedTitle = title.trim();
    
    if (trimmedTitle.length === 0) {
      throw new Error('Quiz title is required');
    }

    if (trimmedTitle.length < 3) {
      throw new Error('Quiz title must be at least 3 characters long');
    }

    if (trimmedTitle.length > 200) {
      throw new Error('Quiz title cannot exceed 200 characters');
    }

    // Create and store quiz
    const quiz = new Quiz(trimmedTitle);
    this.quizzes.set(quiz.id, quiz);
    
    return quiz;
  }

  /**
   * Get a quiz by ID
   * @param {string} quizId - Quiz ID
   * @returns {Quiz} Quiz instance
   * @throws {Error} If quiz not found
   */
  getQuiz(quizId) {
    this.validateQuizId(quizId);

    const quiz = this.quizzes.get(quizId);
    
    if (!quiz) {
      throw new Error('Quiz not found');
    }
    
    return quiz;
  }

  /**
   * Get all quizzes (summary view)
   * @returns {Array} Array of quiz summaries
   */
  getAllQuizzes() {
    const quizList = Array.from(this.quizzes.values());
    return quizList.map(quiz => quiz.getSummary());
  }

  /**
   * Add a question to a quiz with comprehensive validation
   * @param {string} quizId - Quiz ID
   * @param {Object} questionData - Question data
   * @returns {Question} Created question
   * @throws {Error} If validation fails
   */
  addQuestion(quizId, questionData) {
    // Get quiz (throws if not found)
    const quiz = this.getQuiz(quizId);
    
    // Validate question data structure
    this.validateQuestionData(questionData);
    
    // Create question instance
    const question = new Question(
      questionData.text.trim(), 
      questionData.type
    );
    
    // Validate and add options
    this.addOptionsToQuestion(question, questionData.options);
    
    // Validate the complete question
    question.validate();
    
    // Add question to quiz
    quiz.addQuestion(question);
    
    return question;
  }

  /**
   * Add options to a question with validation
   * @private
   */
  addOptionsToQuestion(question, options) {
    if (!options || !Array.isArray(options)) {
      throw new Error('Options must be an array');
    }

    if (options.length === 0) {
      throw new Error('At least one option is required');
    }

    if (options.length > 10) {
      throw new Error('Question cannot have more than 10 options');
    }

    // Track option texts to prevent duplicates
    const optionTexts = new Set();

    options.forEach((optionData, index) => {
      if (!optionData || typeof optionData !== 'object') {
        throw new Error(`Option ${index + 1} must be an object`);
      }

      if (!optionData.text || typeof optionData.text !== 'string') {
        throw new Error(`Option ${index + 1} must have text`);
      }

      const trimmedText = optionData.text.trim();
      
      if (trimmedText.length === 0) {
        throw new Error(`Option ${index + 1} text cannot be empty`);
      }

      if (trimmedText.length > 500) {
        throw new Error(`Option ${index + 1} text cannot exceed 500 characters`);
      }

      // Check for duplicate options
      const lowerText = trimmedText.toLowerCase();
      if (optionTexts.has(lowerText)) {
        throw new Error(`Duplicate option text found: "${trimmedText}"`);
      }
      optionTexts.add(lowerText);

      // Validate isCorrect is boolean
      if (optionData.isCorrect !== undefined && 
          typeof optionData.isCorrect !== 'boolean') {
        throw new Error(`Option ${index + 1} isCorrect must be a boolean`);
      }

      question.addOption(trimmedText, optionData.isCorrect);
    });
  }

  /**
   * Validate question data before processing
   * @private
   */
  validateQuestionData(questionData) {
    if (!questionData || typeof questionData !== 'object') {
      throw new Error('Question data is required');
    }

    // Validate text
    if (!questionData.text || typeof questionData.text !== 'string') {
      throw new Error('Question text is required and must be a string');
    }

    const trimmedText = questionData.text.trim();

    if (trimmedText.length === 0) {
      throw new Error('Question text cannot be empty');
    }

    // Type-specific text validation
    if (questionData.type === 'text' && trimmedText.length > 300) {
      throw new Error('Text-based question cannot exceed 300 characters');
    }

    // General question text limit
    if (trimmedText.length > 1000) {
      throw new Error('Question text cannot exceed 1000 characters');
    }

    // Validate question type
    const validTypes = ['single_choice', 'multiple_choice', 'text'];
    if (!questionData.type) {
      throw new Error('Question type is required');
    }

    if (!validTypes.includes(questionData.type)) {
      throw new Error(
        `Invalid question type: "${questionData.type}". Must be one of: ${validTypes.join(', ')}`
      );
    }
  }

  /**
   * Get quiz questions without revealing answers
   * @param {string} quizId - Quiz ID
   * @returns {Array} Questions without correct answer flags
   * @throws {Error} If quiz not found or has no questions
   */
  getQuizQuestions(quizId) {
    const quiz = this.getQuiz(quizId);
    
    if (quiz.questions.length === 0) {
      throw new Error('Quiz has no questions yet');
    }
    
    return quiz.getQuestionsWithoutAnswers();
  }

  /**
   * Submit quiz answers and calculate score with detailed feedback
   * @param {string} quizId - Quiz ID
   * @param {Array} answers - Array of answer objects
   * @returns {Object} Comprehensive quiz result
   * @throws {Error} If validation fails
   */
  submitQuizAnswers(quizId, answers) {
    // Get quiz
    const quiz = this.getQuiz(quizId);
    
    // Validate quiz has questions
    if (quiz.questions.length === 0) {
      throw new Error('Quiz has no questions');
    }

    // Validate answers format
    this.validateAnswersFormat(answers, quiz);

    // Process answers and calculate score
    const results = this.processAnswers(answers, quiz);
    
    // Calculate statistics
    const stats = this.calculateStatistics(results, quiz.questions.length);

    return {
      ...stats,
      results: results,
      submittedAt: new Date().toISOString()
    };
  }

  /**
   * Validate answers format
   * @private
   */
  validateAnswersFormat(answers, quiz) {
    if (!Array.isArray(answers)) {
      throw new Error('Answers must be an array');
    }

    if (answers.length === 0) {
      throw new Error('At least one answer must be provided');
    }

    if (answers.length > quiz.questions.length) {
      throw new Error('Number of answers exceeds number of questions');
    }

    // Create a map of question IDs for validation
    const questionIds = new Set(quiz.questions.map(q => q.id));
    const answeredQuestionIds = new Set();

    answers.forEach((answer, index) => {
      // Validate answer structure
      if (!answer || typeof answer !== 'object') {
        throw new Error(`Answer ${index + 1} must be an object`);
      }

      if (!answer.questionId) {
        throw new Error(`Answer ${index + 1} is missing questionId`);
      }

      // Check if question exists in quiz
      if (!questionIds.has(answer.questionId)) {
        throw new Error(`Question ${answer.questionId} not found in this quiz`);
      }

      // Check for duplicate answers
      if (answeredQuestionIds.has(answer.questionId)) {
        throw new Error(`Duplicate answer for question ${answer.questionId}`);
      }
      answeredQuestionIds.add(answer.questionId);

      // Validate selectedOptionIds
      if (!answer.selectedOptionIds || !Array.isArray(answer.selectedOptionIds)) {
        throw new Error(`Answer ${index + 1} must have selectedOptionIds as an array`);
      }

      if (answer.selectedOptionIds.length === 0) {
        throw new Error(`Answer ${index + 1} must have at least one selected option`);
      }
    });
  }

  /**
   * Process answers and evaluate correctness
   * @private
   */
  processAnswers(answers, quiz) {
    const results = [];

    answers.forEach(answer => {
      // Find the question
      const question = quiz.findQuestionById(answer.questionId);

      // Validate selected options exist
      const validOptionIds = new Set(question.options.map(opt => opt.id));
      answer.selectedOptionIds.forEach(optionId => {
        if (!validOptionIds.has(optionId)) {
          throw new Error(`Invalid option ID: ${optionId} for question ${question.id}`);
        }
      });

      // Check if answer is correct
      const isCorrect = question.isAnswerCorrect(answer.selectedOptionIds);
      
      // Build detailed result
      results.push({
        questionId: answer.questionId,
        questionText: question.text,
        questionType: question.type,
        selectedOptionIds: answer.selectedOptionIds,
        correctOptionIds: question.getCorrectOptionIds(),
        isCorrect: isCorrect,
        selectedOptions: this.getOptionDetails(question, answer.selectedOptionIds),
        correctOptions: this.getOptionDetails(question, question.getCorrectOptionIds())
      });
    });

    return results;
  }

  /**
   * Get option details by IDs
   * @private
   */
  getOptionDetails(question, optionIds) {
    return optionIds.map(id => {
      const option = question.options.find(opt => opt.id === id);
      return option ? { id: option.id, text: option.text } : null;
    }).filter(opt => opt !== null);
  }

  /**
   * Calculate quiz statistics
   * @private
   */
  calculateStatistics(results, totalQuestions) {
    const correctCount = results.filter(r => r.isCorrect).length;
    const percentage = totalQuestions > 0 
      ? Math.round((correctCount / totalQuestions) * 100) 
      : 0;

    return {
      score: correctCount,
      total: totalQuestions,
      percentage: percentage,
      answeredCount: results.length,
      unansweredCount: totalQuestions - results.length,
      passed: percentage >= 60, // 60% pass threshold
      grade: this.calculateGrade(percentage)
    };
  }

  /**
   * Calculate letter grade based on percentage
   * @private
   */
  calculateGrade(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  /**
   * Delete a quiz
   * @param {string} quizId - Quiz ID
   * @returns {boolean} True if deleted
   * @throws {Error} If quiz not found
   */
  deleteQuiz(quizId) {
    const quiz = this.getQuiz(quizId);
    return this.quizzes.delete(quizId);
  }

  /**
   * Get quiz statistics
   * @param {string} quizId - Quiz ID
   * @returns {Object} Detailed quiz statistics
   */
  getQuizStats(quizId) {
    const quiz = this.getQuiz(quizId);
    
    const stats = {
      totalQuestions: quiz.questions.length,
      questionTypes: {
        single_choice: 0,
        multiple_choice: 0,
        text: 0
      },
      totalOptions: 0,
      averageOptionsPerQuestion: 0,
      totalCorrectAnswers: 0,
      averageCorrectAnswersPerQuestion: 0
    };

    quiz.questions.forEach(question => {
      stats.questionTypes[question.type]++;
      stats.totalOptions += question.options.length;
      stats.totalCorrectAnswers += question.getCorrectOptionIds().length;
    });

    if (quiz.questions.length > 0) {
      stats.averageOptionsPerQuestion = 
        Math.round((stats.totalOptions / quiz.questions.length) * 10) / 10;
      stats.averageCorrectAnswersPerQuestion = 
        Math.round((stats.totalCorrectAnswers / quiz.questions.length) * 10) / 10;
    }

    return stats;
  }

  /**
   * Validate quiz ID format
   * @private
   */
  validateQuizId(quizId) {
    if (!quizId) {
      throw new Error('Quiz ID is required');
    }

    if (typeof quizId !== 'string') {
      throw new Error('Quiz ID must be a string');
    }
  }

  /**
   * Clear all quizzes (useful for testing)
   */
  clearAll() {
    this.quizzes.clear();
  }

  /**
   * Get total number of quizzes
   * @returns {number} Total quiz count
   */
  getQuizCount() {
    return this.quizzes.size;
  }

  /**
   * Update quiz title
   * @param {string} quizId - Quiz ID
   * @param {string} newTitle - New title
   * @returns {Quiz} Updated quiz
   */
  updateQuizTitle(quizId, newTitle) {
    const quiz = this.getQuiz(quizId);
    
    if (!newTitle || typeof newTitle !== 'string') {
      throw new Error('New title must be a non-empty string');
    }

    const trimmedTitle = newTitle.trim();
    
    if (trimmedTitle.length === 0) {
      throw new Error('Quiz title cannot be empty');
    }

    if (trimmedTitle.length > 200) {
      throw new Error('Quiz title cannot exceed 200 characters');
    }

    quiz.title = trimmedTitle;
    quiz.updatedAt = new Date().toISOString();
    
    return quiz;
  }
}

// Export singleton instance
module.exports = new QuizService();