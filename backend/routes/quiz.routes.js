const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');

/**
 * Quiz Routes
 * RESTful API endpoints for quiz management
 */

// Health check for quiz service
router.get('/health', quizController.healthCheck);

// Quiz CRUD operations
router.post('/', quizController.createQuiz);
router.get('/', quizController.getAllQuizzes);
router.get('/:quizId', quizController.getQuizById);
router.delete('/:quizId', quizController.deleteQuiz);

// Question operations
router.post('/:quizId/questions', quizController.addQuestion);
router.get('/:quizId/questions', quizController.getQuizQuestions);

// Quiz submission
router.post('/:quizId/submit', quizController.submitQuizAnswers);

// Statistics
router.get('/:quizId/stats', quizController.getQuizStats);

module.exports = router;