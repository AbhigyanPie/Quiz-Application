import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:3000/api';

function App() {
  const [view, setView] = useState('home');
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states for creating quiz/questions
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [questionForm, setQuestionForm] = useState({
    text: '',
    type: 'single_choice',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]
  });

  // Fetch all quizzes
  const fetchQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes`);
      const data = await response.json();
      if (data.success) {
        setQuizzes(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch quizzes. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Create new quiz
  const createQuiz = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newQuizTitle })
      });
      const data = await response.json();
      if (data.success) {
        setNewQuizTitle('');
        fetchQuizzes();
        alert('Quiz created successfully!');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  // Add question to quiz
  const addQuestion = async (e) => {
    e.preventDefault();
    if (!selectedQuiz) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes/${selectedQuiz.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionForm)
      });
      const data = await response.json();
      if (data.success) {
        setQuestionForm({
          text: '',
          type: 'single_choice',
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ]
        });
        alert('Question added successfully!');
        fetchQuizzes();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  // Fetch questions for taking quiz
  const startQuiz = async (quiz) => {
    setSelectedQuiz(quiz);
    setLoading(true);
    setError(null);
    setAnswers({});
    setResult(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes/${quiz.id}/questions`);
      const data = await response.json();
      if (data.success) {
        setQuestions(data.data);
        setView('takeQuiz');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  // Handle answer selection
  const handleAnswerChange = (questionId, optionId, isMultiple) => {
    setAnswers(prev => {
      if (isMultiple) {
        const current = prev[questionId] || [];
        const newAnswers = current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId];
        return { ...prev, [questionId]: newAnswers };
      } else {
        return { ...prev, [questionId]: [optionId] };
      }
    });
  };

  // Submit quiz
  const submitQuiz = async () => {
    if (!selectedQuiz) return;
    
    const formattedAnswers = Object.entries(answers).map(([questionId, selectedOptionIds]) => ({
      questionId,
      selectedOptionIds
    }));

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes/${selectedQuiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: formattedAnswers })
      });
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setView('result');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  // Add option to question form
  const addOptionToForm = () => {
    setQuestionForm(prev => ({
      ...prev,
      options: [...prev.options, { text: '', isCorrect: false }]
    }));
  };

  // Update option in form
  const updateOption = (index, field, value) => {
    setQuestionForm(prev => {
      const newOptions = [...prev.options];
      newOptions[index] = { ...newOptions[index], [field]: value };
      return { ...prev, options: newOptions };
    });
  };

  // Remove option from form
  const removeOption = (index) => {
    if (questionForm.options.length <= 2) return;
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Render loading state
  if (loading && view === 'home') {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Quiz Application</h1>
        <nav>
          <button onClick={() => { setView('home'); setError(null); }}>Home</button>
          <button onClick={() => { setView('create'); setError(null); }}>Create Quiz</button>
          <button onClick={() => { setView('addQuestion'); setError(null); }}>Add Questions</button>
        </nav>
      </header>

      <main className="main-content">
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* HOME VIEW - List all quizzes */}
        {view === 'home' && (
          <div className="home-view">
            <h2>Available Quizzes</h2>
            {quizzes.length === 0 ? (
              <p className="empty-state">No quizzes available. Create one to get started!</p>
            ) : (
              <div className="quiz-grid">
                {quizzes.map(quiz => (
                  <div key={quiz.id} className="quiz-card">
                    <h3>{quiz.title}</h3>
                    <p className="quiz-info">
                      {quiz.questionCount} {quiz.questionCount === 1 ? 'question' : 'questions'}
                    </p>
                    <p className="quiz-date">
                      Created: {new Date(quiz.createdAt).toLocaleDateString()}
                    </p>
                    <button 
                      className="btn-primary"
                      onClick={() => startQuiz(quiz)}
                      disabled={quiz.questionCount === 0}
                    >
                      {quiz.questionCount === 0 ? 'No Questions' : 'Take Quiz'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE QUIZ VIEW */}
        {view === 'create' && (
          <div className="create-view">
            <h2>Create New Quiz</h2>
            <form onSubmit={createQuiz} className="form">
              <div className="form-group">
                <label htmlFor="quizTitle">Quiz Title</label>
                <input
                  id="quizTitle"
                  type="text"
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                  placeholder="Enter quiz title (3-200 characters)"
                  required
                  minLength={3}
                  maxLength={200}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Quiz'}
              </button>
            </form>
          </div>
        )}

        {/* ADD QUESTION VIEW */}
        {view === 'addQuestion' && (
          <div className="add-question-view">
            <h2>Add Question to Quiz</h2>
            
            <div className="form-group">
              <label>Select Quiz</label>
              <select 
                onChange={(e) => {
                  const quiz = quizzes.find(q => q.id === e.target.value);
                  setSelectedQuiz(quiz);
                }}
                value={selectedQuiz?.id || ''}
              >
                <option value="">-- Select a quiz --</option>
                {quizzes.map(quiz => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title} ({quiz.questionCount} questions)
                  </option>
                ))}
              </select>
            </div>

            {selectedQuiz && (
              <form onSubmit={addQuestion} className="form">
                <div className="form-group">
                  <label htmlFor="questionText">Question Text</label>
                  <textarea
                    id="questionText"
                    value={questionForm.text}
                    onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                    placeholder="Enter your question"
                    required
                    maxLength={questionForm.type === 'text' ? 300 : 1000}
                  />
                  <small>{questionForm.text.length}/{questionForm.type === 'text' ? 300 : 1000} characters</small>
                </div>

                <div className="form-group">
                  <label htmlFor="questionType">Question Type</label>
                  <select
                    id="questionType"
                    value={questionForm.type}
                    onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value })}
                  >
                    <option value="single_choice">Single Choice</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="text">Text Based</option>
                  </select>
                </div>

                <div className="options-section">
                  <label>Options</label>
                  {questionForm.options.map((option, index) => (
                    <div key={index} className="option-row">
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updateOption(index, 'text', e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        required
                      />
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
                        />
                        Correct
                      </label>
                      {questionForm.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="btn-danger-small"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {questionForm.options.length < 10 && (
                    <button type="button" onClick={addOptionToForm} className="btn-secondary">
                      Add Option
                    </button>
                  )}
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Question'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAKE QUIZ VIEW */}
        {view === 'takeQuiz' && (
          <div className="take-quiz-view">
            <h2>{selectedQuiz?.title}</h2>
            <p className="quiz-progress">
              {Object.keys(answers).length} of {questions.length} answered
            </p>

            <div className="questions-container">
              {questions.map((question, index) => (
                <div key={question.id} className="question-card">
                  <h3>Question {index + 1}</h3>
                  <p className="question-text">{question.text}</p>
                  <span className="question-type-badge">{question.type.replace('_', ' ')}</span>

                  <div className="options-list">
                    {question.options.map(option => (
                      <label key={option.id} className="option-label">
                        <input
                          type={question.type === 'multiple_choice' ? 'checkbox' : 'radio'}
                          name={`question-${question.id}`}
                          checked={answers[question.id]?.includes(option.id) || false}
                          onChange={() => handleAnswerChange(
                            question.id,
                            option.id,
                            question.type === 'multiple_choice'
                          )}
                        />
                        <span>{option.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="quiz-actions">
              <button onClick={() => setView('home')} className="btn-secondary">
                Cancel
              </button>
              <button 
                onClick={submitQuiz} 
                className="btn-primary"
                disabled={loading || Object.keys(answers).length === 0}
              >
                {loading ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </div>
          </div>
        )}

        {/* RESULT VIEW */}
        {view === 'result' && result && (
          <div className="result-view">
            <div className="result-card">
              <h2>Quiz Results</h2>
              <div className={`score-circle ${result.passed ? 'passed' : 'failed'}`}>
                <div className="score-value">{result.percentage}%</div>
                <div className="score-grade">Grade: {result.grade}</div>
              </div>

              <div className="result-stats">
                <div className="stat">
                  <strong>{result.score}</strong>
                  <span>Correct</span>
                </div>
                <div className="stat">
                  <strong>{result.total - result.score}</strong>
                  <span>Incorrect</span>
                </div>
                <div className="stat">
                  <strong>{result.total}</strong>
                  <span>Total</span>
                </div>
              </div>

              <div className={`pass-status ${result.passed ? 'passed' : 'failed'}`}>
                {result.passed ? 'PASSED' : 'FAILED'}
              </div>

              <div className="detailed-results">
                <h3>Detailed Results</h3>
                {result.results.map((qResult, index) => (
                  <div key={qResult.questionId} className={`result-item ${qResult.isCorrect ? 'correct' : 'incorrect'}`}>
                    <div className="result-header">
                      <span className="question-number">Q{index + 1}</span>
                      <span className={`result-badge ${qResult.isCorrect ? 'correct' : 'incorrect'}`}>
                        {qResult.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>
                    <p className="question-text">{qResult.questionText}</p>
                    {!qResult.isCorrect && (
                      <div className="answer-comparison">
                        <div className="your-answer">
                          <strong>Your answer:</strong>
                          <ul>
                            {qResult.selectedOptions.map(opt => (
                              <li key={opt.id}>{opt.text}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="correct-answer">
                          <strong>Correct answer:</strong>
                          <ul>
                            {qResult.correctOptions.map(opt => (
                              <li key={opt.id}>{opt.text}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={() => setView('home')} className="btn-primary">
                Back to Home
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;   