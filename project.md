# AI Mock Interview Platform Documentation

## 1. Project Overview

This project is a sophisticated, web-based AI Mock Interview platform built with React, TypeScript, and the Google Gemini API. It provides users with a realistic and interactive way to practice job interviews. The platform supports various interview formats, leverages multimodal AI capabilities for resume analysis, and offers a real-time, voice-based interview experience with instant, detailed feedback.

The application is designed as a Single Page Application (SPA) that guides the user through a seamless, session-based flow from setup to the final performance report. All data is processed on the client-side and is not persisted between sessions.

---

## 2. Core Technologies

-   **Frontend:** React.js, TypeScript
-   **Styling:** Tailwind CSS (via CDN)
-   **AI Engine:** Google Gemini API (`@google/genai`)
    -   **Gemini Pro:** Used for complex reasoning, prompt-following, and JSON generation (Resume Analysis, Question Generation, Reporting, Validation).
    -   **Gemini Flash:** Used for faster, less complex tasks (Input validation).
    -   **Gemini Live API (`gemini-2.5-flash-native-audio-preview-09-2025`):** Powers the real-time, low-latency, audio-in/audio-out conversational interview experience.
-   **PDF Generation:** `jspdf` for downloading the final report.

---

## 3. Project Structure

The project is organized into a `frontend` directory containing all the source code.

```
/
|-- index.html              # Main HTML entry point for the application
|-- index.tsx               # Root React component renderer
|-- App.tsx                 # Main application component, handles routing and state
|-- frontend/
|   |-- App.tsx             # The core application component
|   |-- index.html          # (duplicate, likely for development)
|   |-- index.tsx           # (duplicate, likely for development)
|   |-- components/         # Reusable UI components for the landing page & forms
|   |-- pages/              # Top-level components for each stage of the app flow
|   |-- services/           # Modules for all interactions with the Gemini API
|   |-- icons/              # SVG icons as React components
|-- backend/
|   |-- server.ts           # Placeholder for a potential backend server
|-- project.md              # This documentation file
```

---

## 4. Application Flow & State Management

The entire user journey is managed within the main `frontend/App.tsx` component. It uses a state variable `page` to control which view is rendered, effectively acting as a simple router. The application state is ephemeral and lasts only for the duration of the browser session.

1.  **Landing Page:** (`page: 'landing'`)
    -   The user is presented with the marketing page (`HeroSection`, `FeaturesSection`, etc.).
    -   Clicking "Get Started" transitions the app to the setup phase.

2.  **Setup (`page: 'setup'`)**
    -   The `SetupPage.tsx` component is rendered. The user can choose one of three modes:
        -   **Manual Entry:** Fills out a form with role, experience, topics, etc.
        -   **By Resume:** Uploads a resume file. The `geminiForResumeAnalysis` service is called to parse the file and pre-fill the form data.
        -   **Practice Mode:** A specialized mode for targeted practice by topic, a custom list of questions, or a confidence-building exercise.
    -   Upon submission, the collected configuration is stored in the `setupData` state, and the app transitions to verification.

3.  **Verification (`page: 'verification'`)**
    -   The `VerificationPage.tsx` component displays a summary of the `setupData` for the user to confirm.
    -   The user can either go back to edit or confirm to proceed.

4.  **Pre-Interview (`page: 'before_interview'`)**
    -   The `BeforeInterviewPage.tsx` component acts as a "loading" screen. It orchestrates a series of API calls via `geminiStartInterview.ts`:
        -   Checks for logical consistency between the role and topics.
        -   Validates the target company name.
        -   **Generates all interview questions** based on the `setupData`. This is a crucial step where complex prompt engineering is used.
    -   Once questions are generated, it shows a countdown before starting the interview.

5.  **Interview (`page: 'interview'`)**
    -   The `InterviewPage.tsx` is the core of the application.
    -   It requests camera and microphone access.
    -   It initializes a connection to the **Gemini Live API** via `geminiLiveService.ts` or the `CombinedLiveController.ts`.
    -   The AI interviewer asks questions, and the user's spoken responses are streamed back. A live transcript is displayed.
    -   This page also includes a **Hands-On Coding Mode**, which provides an in-app editor and an AI-powered validation feature (`geminiForValidation.ts`).
    -   When the user leaves, the full transcript and interview duration are captured.

6.  **Summary (`page: 'summary'`)**
    -   The `InterviewSummaryPage.tsx` is displayed.
    -   It makes a final API call to `geminiForReportGeneration.ts`, sending the `setupData` and the full `transcript`.
    -   The AI analyzes the entire conversation and returns a structured report with strengths, weaknesses, and actionable feedback, which is then rendered to the user.
    -   The user can download this report as a PDF.

---

## 5. Landing Page Components

The landing page (`page: 'landing'`) is the initial entry point for users. It is composed of several reusable React components designed to inform and convert potential users.

### 5.1 Features (`FeaturesSection.tsx`)

-   **Purpose:** To highlight the key value propositions of the InterviewAI platform.
-   **Content:** This section presents a grid of "feature cards," each containing an icon, a title, and a short description.
-   **Key Features Displayed:**
    -   **Instant, Detailed Feedback:** Emphasizes the AI-driven analysis on answers, filler words, and pace.
    -   **Realistic Interview Scenarios:** Showcases the tailored question library for specific roles and industries.
    -   **Performance Analytics:** Mentions the ability to track progress over time.
    -   **Customizable Sessions:** Highlights the flexibility to focus on specific question types (behavioral, technical, etc.).

### 5.2 How It Works (`HowItWorksSection.tsx`)

-   **Purpose:** To simplify the user journey and explain how to use the platform in a few easy steps.
-   **Content:** Visually lays out a 3-step process.
-   **Steps:**
    1.  **Select Your Role:** User chooses their career path to get relevant questions.
    2.  **Start the AI Interview:** User engages in a conversation with the AI interviewer.
    3.  **Receive Your Analysis:** User gets an instant, comprehensive report on their performance.

### 5.3 Testimonials (`TestimonialsSection.tsx`)

-   **Purpose:** To build credibility and social proof by showcasing success stories.
-   **Content:** Displays a series of testimonial cards from fictional users in different roles (e.g., Software Engineer, Product Manager).
-   **Structure:** Each testimonial includes:
    -   A compelling quote about their positive experience.
    -   The user's name and professional title.
    -   A profile picture.

### 5.4 FAQ (`FaqSection.tsx`)

-   **Purpose:** To proactively answer common questions and alleviate potential user concerns.
-   **Content:** An interactive accordion-style list of frequently asked questions.
-   **Topics Covered:**
    -   How the AI evaluates answers (mentioning NLP).
    -   Data privacy and security measures.
    -   The range of job roles available for practice.
    -   Mobile device compatibility.

---

## 6. Gemini API Integration (`frontend/services/`)

This is the heart of the application. Each service is tailored for a specific task.

-   **`geminiForResumeAnalysis.ts`**:
    -   Uses Gemini Pro's multimodal capabilities.
    -   Takes a file (PDF, DOCX, TXT), converts it to a base64 `GenerativePart`, and sends it to the model.
    -   The prompt instructs the AI to act as a recruiter, extract key information, and return it in a predefined JSON schema.

-   **`geminiStartInterview.ts`**:
    -   **`checkDetailsConsistency` & `validateCompany`**: These functions perform pre-flight checks using Gemini Flash to ensure the user's input is logical before generating questions.
    -   **`generateInterviewQuestions`**: This is the most complex prompt-engineered function. It builds a highly detailed prompt based on the `setupData`. It instructs the AI to act as a specific persona (e.g., Senior Engineer, HR Manager) and generate questions (conceptual, behavioral, hands-on coding challenges) that match the role, experience level, and interview type. It requests a strict JSON output with categorized questions. For DSA questions, it even requests the LeetCode URL slug if applicable.

-   **`geminiLiveService.ts`**:
    -   Implements the client-side logic for the Gemini Live API for a standard 1-on-1 interview.
    -   It sets up the audio input stream from the user's microphone, processes it in real-time, and sends it to the Gemini model.
    -   It handles incoming server messages containing the AI's audio response and transcription, playing the audio and updating the UI.

-   **`combinedLiveController.ts`**:
    -   An advanced wrapper for the Live API designed to simulate a **panel interview**.
    -   It cleverly initializes and manages **three separate, concurrent Live API sessions**, one for each interviewer persona (Engineer, Manager, HR).
    -   It directs the user's audio to the currently "active" persona and syncs conversation history between the sessions to maintain context, creating the illusion of a multi-person panel.

-   **`geminiForValidation.ts`**:
    -   Powers the "Validate Answer" feature in the coding mode.
    -   It sends the interview question, the question category (e.g., DSA, SQL), and the user's code to Gemini Pro.
    -   The prompt asks the AI to act as a technical evaluator, determine if the code is correct, and provide a short feedback message and a helpful hint if it's incorrect.

-   **`geminiForReportGeneration.ts`**:
    -   After the interview, this service sends the full transcript and the initial setup data to Gemini Pro.
    -   The prompt instructs the AI to act as a career coach, analyze the candidate's answers in the context of the target role, and generate a comprehensive performance report in a structured JSON format.