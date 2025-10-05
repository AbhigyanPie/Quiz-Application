const quizService = require('../services/quiz.service');

/**
 * QuizController
 * Enhanced HTTP request handlers with proper error handling
 * and status codes following RESTful best practices
 */
class QuizController {
  /**
   * Create a new quiz
   * POST /api/quizzes
   */
  createQuiz(req, res) {
    try {
      const { title } = req.body;

      // Validate request body
      if (!title) {
        return res.status(400).json({
          success: false,
          error: 'Title is required in request body',
          field: 'title'
        });
      }

      // Create quiz through service
      const quiz = quizService.createQuiz(title);

      // Return success response with 201 Created
      return res.status(201).json({
        success: true,
        message: 'Quiz created successfully',
        data: {
          id: quiz.id,
          title: quiz.title,
          questionCount: 0,
          createdAt: quiz.createdAt
        }
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get all quizzes
   * GET /api/quizzes
   */
  getAllQuizzes(req, res) {
    try {
      const quizzes = quizService.getAllQuizzes();

      return res.status(200).json({
        success: true,
        count: quizzes.length,
        data: quizzes
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve quizzes',
        details: error.message
      });
    }
  }

  /**
   * Get a specific quiz by ID with statistics
   * GET /api/quizzes/:quizId
   */
  getQuizById(req, res) {
    try {
      const { quizId } = req.params;

      const quiz = quizService.getQuiz(quizId);
      const stats = quizService.getQuizStats(quizId);

      return res.status(200).json({
        success: true,
        data: {
          ...quiz.getSummary(),
          statistics: stats
        }
      });
    } catch (error) {
      const statusCode = error.message === 'Quiz not found' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Add a question to a quiz
   * POST /api/quizzes/:quizId/questions
   */
  addQuestion(req, res) {
    try {
      const { quizId } = req.params;
      const questionData = req.body;

      // Validate request body exists
      if (!questionData || Object.keys(questionData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Question data is required in request body'
        });
      }

      // Validate required fields
      if (!questionData.text) {
        return res.status(400).json({
          success: false,
          error: 'Question text is required',
          field: 'text'
        });
      }

      if (!questionData.type) {
        return res.status(400).json({
          success: false,
          error: 'Question type is required',
          field: 'type'
        });
      }

      if (!questionData.options) {
        return res.status(400).json({
          success: false,
          error: 'Question options are required',
          field: 'options'
        });
      }

      // Add question through service
      const question = quizService.addQuestion(quizId, questionData);

      return res.status(201).json({
        success: true,
        message: 'Question added successfully',
        data: {
          id: question.id,
          text: question.text,
          type: question.type,
          optionCount: question.options.length,
          createdAt: question.createdAt
        }
      });
    } catch (error) {
      // Determine appropriate status code
      let statusCode = 400;
      if (error.message === 'Quiz not found') {
        statusCode = 404;
      }

      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get all questions for a quiz (without answers)
   * GET /api/quizzes/:quizId/questions
   */
  getQuizQuestions(req, res) {
    try {
      const { quizId } = req.params;

      const questions = quizService.getQuizQuestions(quizId);

      return res.status(200).json({
        success: true,
        count: questions.length,
        data: questions
      });
    } catch (error) {
      let statusCode = 500;
      
      if (error.message === 'Quiz not found' || 
          error.message === 'Quiz has no questions yet') {
        statusCode = 404;
      }

      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Submit answers for a quiz and get results
   * POST /api/quizzes/:quizId/submit
   */
  submitQuizAnswers(req, res) {
    try {
      const { quizId } = req.params;
      const { answers } = req.body;

      // Validate request body
      if (!answers) {
        return res.status(400).json({
          success: false,
          error: 'Answers array is required in request body',
          field: 'answers',
          expectedFormat: [
            {
              questionId: 'string',
              selectedOptionIds: ['string']
            }
          ]
        });
      }

      // Submit answers and get results
      const result = quizService.submitQuizAnswers(quizId, answers);

      return res.status(200).json({
        success: true,
        message: 'Quiz submitted successfully',
        data: result
      });
    } catch (error) {
      let statusCode = 400;
      
      if (error.message === 'Quiz not found') {
        statusCode = 404;
      }

      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Delete a quiz
   * DELETE /api/quizzes/:quizId
   */
  deleteQuiz(req, res) {
    try {
      const { quizId } = req.params;

      quizService.deleteQuiz(quizId);

      return res.status(200).json({
        success: true,
        message: 'Quiz deleted successfully',
        data: {
          deletedQuizId: quizId,
          deletedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      const statusCode = error.message === 'Quiz not found' ? 404 : 500;
      
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get quiz statistics
   * GET /api/quizzes/:quizId/stats
   */
  getQuizStats(req, res) {
    try {
      const { quizId } = req.params;

      const stats = quizService.getQuizStats(quizId);
      const quiz = quizService.getQuiz(quizId);

      return res.status(200).json({
        success: true,
        data: {
          quizId: quiz.id,
          quizTitle: quiz.title,
          statistics: stats
        }
      });
    } catch (error) {
      const statusCode = error.message === 'Quiz not found' ? 404 : 500;
      
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Health check for quiz service
   * GET /api/quizzes/health
   */
  healthCheck(req, res) {
    try {
      const totalQuizzes = quizService.getQuizCount();
      
      return res.status(200).json({
        success: true,
        message: 'Quiz service is operational',
        data: {
          status: 'healthy',
          totalQuizzes: totalQuizzes,
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        }
      });
    } catch (error) {
      return res.status(503).json({
        success: false,
        message: 'Quiz service is unavailable',
        error: error.message
      });
    }
  }
}

// Export singleton instance with bound methods
const controller = new QuizController();

module.exports = {
  createQuiz: controller.createQuiz.bind(controller),
  getAllQuizzes: controller.getAllQuizzes.bind(controller),
  getQuizById: controller.getQuizById.bind(controller),
  addQuestion: controller.addQuestion.bind(controller),
  getQuizQuestions: controller.getQuizQuestions.bind(controller),
  submitQuizAnswers: controller.submitQuizAnswers.bind(controller),
  deleteQuiz: controller.deleteQuiz.bind(controller),
  getQuizStats: controller.getQuizStats.bind(controller),
  healthCheck: controller.healthCheck.bind(controller)
};