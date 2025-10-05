# Quiz Application Backend API

A comprehensive RESTful API for managing quizzes with robust validation, multiple question types, and scoring functionality.
![4](https://github.com/user-attachments/assets/e1199ec6-a36f-446d-8129-4397588a9fda)

##  Features

- **Quiz Management**: Create, read, update, and delete quizzes
- **Question Types**: Support for single choice, multiple choice, and text-based questions
- **Validation**: Comprehensive input validation and error handling
- **Scoring System**: Automatic grading with percentage and letter grades
- **Security**: Rate limiting, CORS, and security headers
- **Testing**: 100% test coverage with Jest

##  Requirements

- Node.js >= 14.x
- npm >= 6.x

##  Installation

```bash
# Clone the repository
git clone <repository-url>
cd quiz-application-backend

# Install dependencies
npm install
```

##  Running the Application

```bash
# Production mode
npm start

# Development mode with auto-reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:watch
```

The server will start on `http://localhost:3000`

##  API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### 1. Create Quiz
**POST** `/quizzes`

Create a new quiz with a title.

**Request Body:**
```json
{
  "title": "JavaScript Basics"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz created successfully",
  "data": {
    "id": "uuid",
    "title": "JavaScript Basics",
    "questionCount": 0,
    "createdAt": "2025-10-05T10:00:00.000Z"
  }
}
```

**Validation Rules:**
- Title is required
- Title must be a string
- Title must be 3-200 characters
- Whitespace is trimmed

---

#### 2. Get All Quizzes
**GET** `/quizzes`

Retrieve all quizzes with summary information.

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "uuid",
      "title": "JavaScript Basics",
      "questionCount": 5,
      "createdAt": "2025-10-05T10:00:00.000Z",
      "updatedAt": "2025-10-05T10:30:00.000Z"
    }
  ]
}
```

---

#### 3. Get Quiz by ID
**GET** `/quizzes/:quizId`

Get detailed information about a specific quiz including statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "JavaScript Basics",
    "questionCount": 5,
    "createdAt": "2025-10-05T10:00:00.000Z",
    "updatedAt": "2025-10-05T10:30:00.000Z",
    "statistics": {
      "totalQuestions": 5,
      "questionTypes": {
        "single_choice": 3,
        "multiple_choice": 2,
        "text": 0
      },
      "totalOptions": 15,
      "averageOptionsPerQuestion": 3.0
    }
  }
}
```

---

#### 4. Add Question to Quiz
**POST** `/quizzes/:quizId/questions`

Add a question to an existing quiz.

**Request Body - Single Choice:**
```json
{
  "text": "What is 2+2?",
  "type": "single_choice",
  "options": [
    { "text": "3", "isCorrect": false },
    { "text": "4", "isCorrect": true },
    { "text": "5", "isCorrect": false }
  ]
}
```

**Request Body - Multiple Choice:**
```json
{
  "text": "Select all programming languages",
  "type": "multiple_choice",
  "options": [
    { "text": "JavaScript", "isCorrect": true },
    { "text": "Python", "isCorrect": true },
    { "text": "HTML", "isCorrect": false }
  ]
}
```

**Request Body - Text Based:**
```json
{
  "text": "What is the capital of France?",
  "type": "text",
  "options": [
    { "text": "Paris", "isCorrect": true }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Question added successfully",
  "data": {
    "id": "uuid",
    "text": "What is 2+2?",
    "type": "single_choice",
    "optionCount": 3,
    "createdAt": "2025-10-05T10:30:00.000Z"
  }
}
```

**Validation Rules:**

**Single Choice:**
- Must have exactly 1 correct answer
- Must have at least 2 options

**Multiple Choice:**
- Must have at least 2 correct answers
- Must have at least 1 incorrect option
- Must have at least 3 total options

**Text Based:**
- Question text cannot exceed 300 characters
- Can have multiple acceptable answers

**General Rules:**
- Question text: 1-1000 characters (300 for text type)
- Option text: 1-500 characters
- Maximum 10 options per question
- No duplicate options (case-insensitive)

---

#### 5. Get Quiz Questions
**GET** `/quizzes/:quizId/questions`

Retrieve all questions for a quiz **without** correct answer information (for quiz takers).

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "uuid",
      "text": "What is 2+2?",
      "type": "single_choice",
      "options": [
        { "id": "uuid", "text": "3" },
        { "id": "uuid", "text": "4" },
        { "id": "uuid", "text": "5" }
      ]
    }
  ]
}
```

---

#### 6. Submit Quiz Answers
**POST** `/quizzes/:quizId/submit`

Submit answers for a quiz and receive results.

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "uuid",
      "selectedOptionIds": ["uuid"]
    },
    {
      "questionId": "uuid",
      "selectedOptionIds": ["uuid", "uuid"]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz submitted successfully",
  "data": {
    "score": 8,
    "total": 10,
    "percentage": 80,
    "answeredCount": 10,
    "unansweredCount": 0,
    "passed": true,
    "grade": "B",
    "results": [
      {
        "questionId": "uuid",
        "questionText": "What is 2+2?",
        "questionType": "single_choice",
        "selectedOptionIds": ["uuid"],
        "correctOptionIds": ["uuid"],
        "isCorrect": true,
        "selectedOptions": [
          { "id": "uuid", "text": "4" }
        ],
        "correctOptions": [
          { "id": "uuid", "text": "4" }
        ]
      }
    ],
    "submittedAt": "2025-10-05T11:00:00.000Z"
  }
}
```

**Grading Scale:**
- A: 90-100%
- B: 80-89%
- C: 70-79%
- D: 60-69%
- F: Below 60%

**Pass Threshold:** 60%

---

#### 7. Delete Quiz
**DELETE** `/quizzes/:quizId`

Delete a quiz and all its questions.

**Response:**
```json
{
  "success": true,
  "message": "Quiz deleted successfully",
  "data": {
    "deletedQuizId": "uuid",
    "deletedAt": "2025-10-05T11:00:00.000Z"
  }
}
```

---

#### 8. Get Quiz Statistics
**GET** `/quizzes/:quizId/stats`

Get detailed statistics about a quiz.

**Response:**
```json
{
  "success": true,
  "data": {
    "quizId": "uuid",
    "quizTitle": "JavaScript Basics",
    "statistics": {
      "totalQuestions": 10,
      "questionTypes": {
        "single_choice": 6,
        "multiple_choice": 3,
        "text": 1
      },
      "totalOptions": 35,
      "averageOptionsPerQuestion": 3.5,
      "totalCorrectAnswers": 12,
      "averageCorrectAnswersPerQuestion": 1.2
    }
  }
}
```

---

#### 9. Health Check
**GET** `/quizzes/health`

Check if the quiz service is operational.

**Response:**
```json
{
  "success": true,
  "message": "Quiz service is operational",
  "data": {
    "status": "healthy",
    "totalQuizzes": 5,
    "timestamp": "2025-10-05T11:00:00.000Z",
    "uptime": 3600.5
  }
}
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Comprehensive validation on all inputs
- **JSON Size Limit**: 10MB request body limit

## Testing

The application includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch
```

**Test Coverage:**
- Quiz creation and validation
- Question addition with all types
- Answer submission and scoring
- Edge cases and error scenarios
- Security and validation tests

## Project Structure

```
Quiz_api/
├── backend/
│   ├── controllers/
│   │   └── quiz.controller.js
│   ├── models/
│   │   └── quiz.model.js
│   ├── routes/
│   │   └── quiz.routes.js
│   ├── services/
│   │   └── quiz.service.js
│   ├── tests/
│   │   └── quiz.service.test.js
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── index.js
    │   └── index.css
    └── package.json
```

## Design Patterns

- **MVC Architecture**: Clear separation of concerns
- **Service Layer Pattern**: Business logic isolation
- **Singleton Pattern**: Service instances
- **Factory Pattern**: Model creation
- **Repository Pattern**: Data access abstraction

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `404`: Not Found
- `429`: Too Many Requests (rate limit)
- `500`: Internal Server Error

## Example Usage Flow

```bash
# 1. Create a quiz
curl -X POST http://localhost:3000/api/quizzes \
  -H "Content-Type: application/json" \
  -d '{"title": "JavaScript Quiz"}'

# 2. Add a question
curl -X POST http://localhost:3000/api/quizzes/{quizId}/questions \
  -H "Content-Type: application/json" \
  -d '{
    "text": "What is a closure?",
    "type": "single_choice",
    "options": [
      {"text": "A function", "isCorrect": false},
      {"text": "A function with lexical scope", "isCorrect": true}
    ]
  }'

# 3. Get questions (for quiz takers)
curl http://localhost:3000/api/quizzes/{quizId}/questions

# 4. Submit answers
curl -X POST http://localhost:3000/api/quizzes/{quizId}/submit \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {
        "questionId": "{questionId}",
        "selectedOptionIds": ["{optionId}"]
      }
    ]
  }'
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request


---

**Built with ❤️ using Node.js and Express**


