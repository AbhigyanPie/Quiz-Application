const quizService = require('../services/quiz.service');

describe('QuizService - Comprehensive Tests', () => {
  beforeEach(() => {
    // Clear quizzes before each test
    quizService.clearAll();
  });

  describe('createQuiz', () => {
    it('should create a quiz with a valid title', () => {
      const quiz = quizService.createQuiz('JavaScript Basics');
      
      expect(quiz).toBeDefined();
      expect(quiz.id).toBeDefined();
      expect(quiz.title).toBe('JavaScript Basics');
      expect(quiz.questions).toEqual([]);
      expect(quiz.createdAt).toBeDefined();
    });

    it('should throw error for empty title', () => {
      expect(() => quizService.createQuiz('')).toThrow('Quiz title is required');
    });

    it('should throw error for null title', () => {
      expect(() => quizService.createQuiz(null)).toThrow('Quiz title is required');
    });

    it('should throw error for undefined title', () => {
      expect(() => quizService.createQuiz(undefined)).toThrow('Quiz title is required');
    });

    it('should throw error for non-string title', () => {
      expect(() => quizService.createQuiz(123)).toThrow('Quiz title must be a string');
      expect(() => quizService.createQuiz({})).toThrow('Quiz title must be a string');
    });

    it('should trim whitespace from title', () => {
      const quiz = quizService.createQuiz('  Spaced Title  ');
      expect(quiz.title).toBe('Spaced Title');
    });

    it('should throw error for title less than 3 characters', () => {
      expect(() => quizService.createQuiz('ab')).toThrow('Quiz title must be at least 3 characters long');
    });

    it('should throw error for title exceeding 200 characters', () => {
      const longTitle = 'a'.repeat(201);
      expect(() => quizService.createQuiz(longTitle)).toThrow('Quiz title cannot exceed 200 characters');
    });
  });

  describe('addQuestion', () => {
    let quizId;

    beforeEach(() => {
      const quiz = quizService.createQuiz('Test Quiz');
      quizId = quiz.id;
    });

    it('should add a single choice question', () => {
      const questionData = {
        text: 'What is 2+2?',
        type: 'single_choice',
        options: [
          { text: '3', isCorrect: false },
          { text: '4', isCorrect: true },
          { text: '5', isCorrect: false }
        ]
      };

      const question = quizService.addQuestion(quizId, questionData);
      
      expect(question.text).toBe('What is 2+2?');
      expect(question.type).toBe('single_choice');
      expect(question.options.length).toBe(3);
    });

    it('should throw error for single choice with multiple correct answers', () => {
      const questionData = {
        text: 'Invalid question',
        type: 'single_choice',
        options: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: true }
        ]
      };

      expect(() => quizService.addQuestion(quizId, questionData))
        .toThrow('Single choice questions can only have one correct answer');
    });

    it('should throw error for single choice with no correct answer', () => {
      const questionData = {
        text: 'Invalid question',
        type: 'single_choice',
        options: [
          { text: 'A', isCorrect: false },
          { text: 'B', isCorrect: false }
        ]
      };

      expect(() => quizService.addQuestion(quizId, questionData))
        .toThrow('At least one correct answer is required');
    });

    it('should add a multiple choice question', () => {
      const questionData = {
        text: 'Select all even numbers',
        type: 'multiple_choice',
        options: [
          { text: '2', isCorrect: true },
          { text: '3', isCorrect: false },
          { text: '4', isCorrect: true }
        ]
      };

      const question = quizService.addQuestion(quizId, questionData);
      
      expect(question.type).toBe('multiple_choice');
      const correctOptions = question.options.filter(opt => opt.isCorrect);
      expect(correctOptions.length).toBe(2);
    });

    it('should throw error for multiple choice with less than 2 correct answers', () => {
      const questionData = {
        text: 'Invalid question',
        type: 'multiple_choice',
        options: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false },
          { text: 'C', isCorrect: false }
        ]
      };

      expect(() => quizService.addQuestion(quizId, questionData))
        .toThrow('Multiple choice questions must have at least 2 correct answers');
    });

    it('should throw error for multiple choice with all correct answers', () => {
      const questionData = {
        text: 'Invalid question',
        type: 'multiple_choice',
        options: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: true },
          { text: 'C', isCorrect: true }
        ]
      };

      expect(() => quizService.addQuestion(quizId, questionData))
        .toThrow('Multiple choice questions must have at least one incorrect option');
    });

    it('should enforce 300 character limit for text questions', () => {
      const longText = 'a'.repeat(301);
      const questionData = {
        text: longText,
        type: 'text',
        options: [{ text: 'Answer', isCorrect: true }]
      };

      expect(() => quizService.addQuestion(quizId, questionData))
        .toThrow('Text-based question cannot exceed 300 characters');
    });

    it('should throw error for question without options', () => {
      const questionData = {
        text: 'Question without options',
        type: 'single_choice',
        options: []
      };

      expect(() => quizService.addQuestion(quizId, questionData))
        .toThrow('At least one option is required');
    });

    it('should throw error for duplicate options', () => {
      const questionData = {
        text: 'Question with duplicates',
        type: 'single_choice',
        options: [
          { text: 'Same Answer', isCorrect: true },
          { text: 'Same Answer', isCorrect: false }
        ]
      };

      expect(() => quizService.addQuestion(quizId, questionData))
        .toThrow('Duplicate option text found');
    });

    it('should throw error for option exceeding 500 characters', () => {
      const longOption = 'a'.repeat(501);
      const questionData = {
        text: 'Question',
        type: 'single_choice',
        options: [
          { text: longOption, isCorrect: true },
          { text: 'B', isCorrect: false }
        ]
      };

      expect(() => quizService.addQuestion(quizId, questionData))
        .toThrow('Option 1 text cannot exceed 500 characters');
    });

    it('should throw error for more than 10 options', () => {
      const options = Array.from({ length: 11 }, (_, i) => ({
        text: `Option ${i + 1}`,
        isCorrect: i === 0
      }));

      const questionData = {
        text: 'Too many options',
        type: 'single_choice',
        options: options
      };

      expect(() => quizService.addQuestion(quizId, questionData))
        .toThrow('Question cannot have more than 10 options');
    });

    it('should throw error for invalid question type', () => {
      const questionData = {
        text: 'Question',
        type: 'invalid_type',
        options: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false }
        ]
      };

      expect(() => quizService.addQuestion(quizId, questionData))
        .toThrow('Invalid question type');
    });
  });

  describe('submitQuizAnswers', () => {
    let quizId;

    beforeEach(() => {
      const quiz = quizService.createQuiz('Math Quiz');
      quizId = quiz.id;

      // Add single choice question
      quizService.addQuestion(quizId, {
        text: 'What is 2+2?',
        type: 'single_choice',
        options: [
          { text: '3', isCorrect: false },
          { text: '4', isCorrect: true },
          { text: '5', isCorrect: false }
        ]
      });

      // Add multiple choice question
      quizService.addQuestion(quizId, {
        text: 'Select all prime numbers',
        type: 'multiple_choice',
        options: [
          { text: '2', isCorrect: true },
          { text: '3', isCorrect: true },
          { text: '4', isCorrect: false }
        ]
      });
    });

    it('should calculate score correctly for all correct answers', () => {
      const quiz = quizService.getQuiz(quizId);
      const questions = quiz.questions;

      const answers = [
        {
          questionId: questions[0].id,
          selectedOptionIds: [questions[0].options[1].id]
        },
        {
          questionId: questions[1].id,
          selectedOptionIds: [
            questions[1].options[0].id,
            questions[1].options[1].id
          ]
        }
      ];

      const result = quizService.submitQuizAnswers(quizId, answers);

      expect(result.score).toBe(2);
      expect(result.total).toBe(2);
      expect(result.percentage).toBe(100);
      expect(result.passed).toBe(true);
      expect(result.grade).toBe('A');
    });

    it('should calculate score correctly for partial correct answers', () => {
      const quiz = quizService.getQuiz(quizId);
      const questions = quiz.questions;

      const answers = [
        {
          questionId: questions[0].id,
          selectedOptionIds: [questions[0].options[1].id]
        },
        {
          questionId: questions[1].id,
          selectedOptionIds: [questions[1].options[0].id]
        }
      ];

      const result = quizService.submitQuizAnswers(quizId, answers);

      expect(result.score).toBe(1);
      expect(result.total).toBe(2);
      expect(result.percentage).toBe(50);
      expect(result.passed).toBe(false);
    });

    it('should return results with correct/incorrect status', () => {
      const quiz = quizService.getQuiz(quizId);
      const questions = quiz.questions;

      const answers = [
        {
          questionId: questions[0].id,
          selectedOptionIds: [questions[0].options[0].id]
        }
      ];

      const result = quizService.submitQuizAnswers(quizId, answers);

      expect(result.results[0].isCorrect).toBe(false);
      expect(result.results[0].correctOptionIds).toBeDefined();
      expect(result.results[0].selectedOptions).toBeDefined();
      expect(result.results[0].correctOptions).toBeDefined();
    });

    it('should throw error for empty answers array', () => {
      expect(() => quizService.submitQuizAnswers(quizId, []))
        .toThrow('At least one answer must be provided');
    });

    it('should throw error for duplicate question answers', () => {
      const quiz = quizService.getQuiz(quizId);
      const questions = quiz.questions;

      const answers = [
        {
          questionId: questions[0].id,
          selectedOptionIds: [questions[0].options[1].id]
        },
        {
          questionId: questions[0].id,
          selectedOptionIds: [questions[0].options[1].id]
        }
      ];

      expect(() => quizService.submitQuizAnswers(quizId, answers))
        .toThrow('Duplicate answer for question');
    });

    it('should throw error for invalid option ID', () => {
      const quiz = quizService.getQuiz(quizId);
      const questions = quiz.questions;

      const answers = [
        {
          questionId: questions[0].id,
          selectedOptionIds: ['invalid-option-id']
        }
      ];

      expect(() => quizService.submitQuizAnswers(quizId, answers))
        .toThrow('Invalid option ID');
    });

    it('should throw error for question not in quiz', () => {
      const answers = [
        {
          questionId: 'non-existent-question-id',
          selectedOptionIds: ['some-option-id']
        }
      ];

      expect(() => quizService.submitQuizAnswers(quizId, answers))
        .toThrow('not found in this quiz');
    });

    it('should calculate correct grades', () => {
      const quiz = quizService.getQuiz(quizId);
      const questions = quiz.questions;

      const answers = [
        {
          questionId: questions[0].id,
          selectedOptionIds: [questions[0].options[1].id]
        }
      ];

      const result = quizService.submitQuizAnswers(quizId, answers);
      expect(result.percentage).toBe(50);
      expect(result.grade).toBe('F');
    });
  });

  describe('getAllQuizzes', () => {
    it('should return empty array when no quizzes exist', () => {
      const quizzes = quizService.getAllQuizzes();
      expect(quizzes).toEqual([]);
    });

    it('should return all quizzes with summary information', () => {
      quizService.createQuiz('Quiz 1');
      quizService.createQuiz('Quiz 2');

      const quizzes = quizService.getAllQuizzes();

      expect(quizzes.length).toBe(2);
      expect(quizzes[0]).toHaveProperty('id');
      expect(quizzes[0]).toHaveProperty('title');
      expect(quizzes[0]).toHaveProperty('questionCount');
      expect(quizzes[0]).toHaveProperty('createdAt');
    });
  });

  describe('getQuizQuestions', () => {
    it('should return questions without correct answers', () => {
      const quiz = quizService.createQuiz('Test Quiz');
      
      quizService.addQuestion(quiz.id, {
        text: 'Question 1',
        type: 'single_choice',
        options: [
          { text: 'A', isCorrect: false },
          { text: 'B', isCorrect: true }
        ]
      });

      const questions = quizService.getQuizQuestions(quiz.id);

      expect(questions[0].options[0]).not.toHaveProperty('isCorrect');
      expect(questions[0].options[1]).not.toHaveProperty('isCorrect');
      expect(questions[0]).toHaveProperty('text');
      expect(questions[0]).toHaveProperty('type');
    });

    it('should throw error for quiz without questions', () => {
      const quiz = quizService.createQuiz('Empty Quiz');
      
      expect(() => quizService.getQuizQuestions(quiz.id))
        .toThrow('Quiz has no questions yet');
    });
  });

  describe('getQuizStats', () => {
    it('should return detailed statistics', () => {
      const quiz = quizService.createQuiz('Stats Quiz');
      
      quizService.addQuestion(quiz.id, {
        text: 'Q1',
        type: 'single_choice',
        options: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false }
        ]
      });

      quizService.addQuestion(quiz.id, {
        text: 'Q2',
        type: 'multiple_choice',
        options: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: true },
          { text: 'C', isCorrect: false }
        ]
      });

      const stats = quizService.getQuizStats(quiz.id);

      expect(stats.totalQuestions).toBe(2);
      expect(stats.questionTypes.single_choice).toBe(1);
      expect(stats.questionTypes.multiple_choice).toBe(1);
      expect(stats.totalOptions).toBe(5);
      expect(stats.averageOptionsPerQuestion).toBe(2.5);
    });
  });

  describe('deleteQuiz', () => {
    it('should delete an existing quiz', () => {
      const quiz = quizService.createQuiz('To Delete');
      const quizId = quiz.id;

      expect(quizService.getQuizCount()).toBe(1);
      
      const deleted = quizService.deleteQuiz(quizId);
      
      expect(deleted).toBe(true);
      expect(quizService.getQuizCount()).toBe(0);
    });

    it('should throw error when deleting non-existent quiz', () => {
      expect(() => quizService.deleteQuiz('non-existent-id'))
        .toThrow('Quiz not found');
    });

    it('should handle multiple choice with partial selections incorrectly', () => {
      const quiz = quizService.getQuiz(quizId);
      const questions = quiz.questions;

      // Select only some correct answers for multiple choice
      const partialCorrect = [questions[1].options[0].id]; // Only '2', missing '3'

      const answers = [
        {
          questionId: questions[1].id,
          selectedOptionIds: partialCorrect
        }
      ];

      const result = quizService.submitQuizAnswers(quizId, answers);
      expect(result.results[0].isCorrect).toBe(false);
    });

    it('should throw error for answers not as array', () => {
      expect(() => quizService.submitQuizAnswers(quizId, {}))
        .toThrow('Answers must be an array');
    });

    it('should throw error for answer without questionId', () => {
      const answers = [
        {
          selectedOptionIds: ['some-id']
        }
      ];

      expect(() => quizService.submitQuizAnswers(quizId, answers))
        .toThrow('missing questionId');
    });

    it('should throw error for answer without selectedOptionIds', () => {
      const quiz = quizService.getQuiz(quizId);
      
      const answers = [
        {
          questionId: quiz.questions[0].id
        }
      ];

      expect(() => quizService.submitQuizAnswers(quizId, answers))
        .toThrow('must have selectedOptionIds as an array');
    });

    it('should calculate unanswered count correctly', () => {
      const quiz = quizService.getQuiz(quizId);
      const questions = quiz.questions;

      const answers = [
        {
          questionId: questions[0].id,
          selectedOptionIds: [questions[0].options[0].id]
        }
      ];

      const result = quizService.submitQuizAnswers(quizId, answers);
      expect(result.answeredCount).toBe(1);
      expect(result.unansweredCount).toBe(1);
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle quiz with many questions', () => {
      const quiz = quizService.createQuiz('Large Quiz');
      
      for (let i = 0; i < 50; i++) {
        quizService.addQuestion(quiz.id, {
          text: `Question ${i + 1}`,
          type: 'single_choice',
          options: [
            { text: 'A', isCorrect: true },
            { text: 'B', isCorrect: false }
          ]
        });
      }

      const questions = quizService.getQuizQuestions(quiz.id);
      expect(questions.length).toBe(50);
    });

    it('should handle duplicate option detection case-insensitively', () => {
      const questionData = {
        text: 'Duplicate check',
        type: 'single_choice',
        options: [
          { text: 'Answer', isCorrect: true },
          { text: 'ANSWER', isCorrect: false }
        ]
      };

      expect(() => quizService.addQuestion(quizId, questionData))
        .toThrow('Duplicate option text found');
    });

    it('should maintain quiz statistics accuracy', () => {
      const stats = quizService.getQuizStats(quizId);
      
      expect(stats.totalQuestions).toBe(2);
      expect(stats.questionTypes.single_choice).toBe(1);
      expect(stats.questionTypes.multiple_choice).toBe(1);
      expect(stats.totalOptions).toBe(7);
    });
  });

  describe('Grade Calculation', () => {
    it('should assign grade A for 90%+', () => {
      const quiz = quizService.createQuiz('Grading Quiz');
      
      for (let i = 0; i < 10; i++) {
        quizService.addQuestion(quiz.id, {
          text: `Q${i}`,
          type: 'single_choice',
          options: [
            { text: 'Correct', isCorrect: true },
            { text: 'Wrong', isCorrect: false }
          ]
        });
      }

      const questions = quizService.getQuiz(quiz.id).questions;
      const answers = questions.slice(0, 9).map(q => ({
        questionId: q.id,
        selectedOptionIds: [q.options[0].id]
      }));

      const result = quizService.submitQuizAnswers(quiz.id, answers);
      expect(result.percentage).toBe(90);
      expect(result.grade).toBe('A');
    });

    it('should assign grade F for below 60%', () => {
      const quiz = quizService.createQuiz('Fail Quiz');
      
      for (let i = 0; i < 10; i++) {
        quizService.addQuestion(quiz.id, {
          text: `Q${i}`,
          type: 'single_choice',
          options: [
            { text: 'Correct', isCorrect: true },
            { text: 'Wrong', isCorrect: false }
          ]
        });
      }

      const questions = quizService.getQuiz(quiz.id).questions;
      const answers = questions.slice(0, 5).map(q => ({
        questionId: q.id,
        selectedOptionIds: [q.options[1].id] // Wrong answers
      }));

      const result = quizService.submitQuizAnswers(quiz.id, answers);
      expect(result.percentage).toBe(0);
      expect(result.grade).toBe('F');
      expect(result.passed).toBe(false);
    });
  });
});

describe('Question Model - Advanced Validation', () => {
  describe('isAnswerCorrect', () => {
    it('should return false for empty selected options', () => {
      const { Question } = require('../models/quiz.model');
      const question = new Question('Test', 'single_choice');
      question.addOption('A', true);
      question.addOption('B', false);

      expect(question.isAnswerCorrect([])).toBe(false);
    });

    it('should return false for non-array input', () => {
      const { Question } = require('../models/quiz.model');
      const question = new Question('Test', 'single_choice');
      question.addOption('A', true);

      expect(question.isAnswerCorrect('not-array')).toBe(false);
      expect(question.isAnswerCorrect(null)).toBe(false);
      expect(question.isAnswerCorrect(undefined)).toBe(false);
    });

    it('should handle duplicate selections in array', () => {
      const { Question } = require('../models/quiz.model');
      const question = new Question('Test', 'single_choice');
      const opt = question.addOption('A', true);

      // Duplicates should be filtered out
      expect(question.isAnswerCorrect([opt.id, opt.id])).toBe(false);
    });

    it('should validate single choice with multiple selections', () => {
      const { Question } = require('../models/quiz.model');
      const question = new Question('Test', 'single_choice');
      const opt1 = question.addOption('A', true);
      const opt2 = question.addOption('B', false);

      expect(question.isAnswerCorrect([opt1.id, opt2.id])).toBe(false);
    });

    it('should validate multiple choice needs all correct answers', () => {
      const { Question } = require('../models/quiz.model');
      const question = new Question('Test', 'multiple_choice');
      const opt1 = question.addOption('A', true);
      const opt2 = question.addOption('B', true);
      const opt3 = question.addOption('C', false);

      // Only selecting one correct answer should fail
      expect(question.isAnswerCorrect([opt1.id])).toBe(false);
    });

    it('should validate multiple choice with incorrect option included', () => {
      const { Question } = require('../models/quiz.model');
      const question = new Question('Test', 'multiple_choice');
      const opt1 = question.addOption('A', true);
      const opt2 = question.addOption('B', true);
      const opt3 = question.addOption('C', false);

      // Selecting all correct + one incorrect should fail
      expect(question.isAnswerCorrect([opt1.id, opt2.id, opt3.id])).toBe(false);
    });
  });
});

describe('Quiz Model - Additional Features', () => {
  it('should find question by ID', () => {
    const { Quiz, Question } = require('../models/quiz.model');
    const quiz = new Quiz('Test');
    const question = new Question('Q1', 'single_choice');
    question.addOption('A', true);
    quiz.addQuestion(question);

    const found = quiz.findQuestionById(question.id);
    expect(found).toBe(question);
  });

  it('should return null for non-existent question ID', () => {
    const { Quiz } = require('../models/quiz.model');
    const quiz = new Quiz('Test');

    const found = quiz.findQuestionById('fake-id');
    expect(found).toBeNull();
  });

  it('should update timestamp when question is added', () => {
    const { Quiz, Question } = require('../models/quiz.model');
    const quiz = new Quiz('Test');
    const originalUpdated = quiz.updatedAt;

    // Wait a bit to ensure timestamp changes
    setTimeout(() => {
      const question = new Question('Q1', 'single_choice');
      question.addOption('A', true);
      quiz.addQuestion(question);

      expect(quiz.updatedAt).not.toBe(originalUpdated);
    }, 10);
  });
});