# Project To-Do & Improvement Plan

This document outlines the key tasks for improving the AI Mock Interview platform, focusing on architecture, code quality, features, and security.

---

### High-Priority / Core Architecture

These tasks are foundational and will significantly improve the app's scalability and maintainability.

-   [ ] **Implement a Build Process with Vite:**
    -   **Why:** The current CDN-based setup is not suitable for production. A build tool like Vite will enable code bundling, minification, tree-shaking, and proper environment variable management.
    -   **Action:** Set up a `vite.config.ts`, manage dependencies via `package.json`, and replace CDN `<script>` tags.

-   [ ] **Introduce `react-router-dom` for Routing:**
    -   **Why:** The current string-based routing in `App.tsx` is brittle, prevents browser history (back/forward buttons), and doesn't allow for deep linking.
    -   **Action:** Replace the `page` state with `createBrowserRouter` and use `<Link>` and `useNavigate` for navigation.

-   [x] **Refactor State Management with React Context:**
    -   **Why:** `App.tsx` holds all interview-related state (`setupData`, `transcript`, etc.), leading to significant prop-drilling.
    -   **Action:** Created an `InterviewContext` to provide interview state and dispatcher functions to the relevant pages. Authentication has been removed from the application.

---

### Component Refactoring & UX Improvements

These tasks focus on improving code structure and the user experience.

-   [ ] **Break Down `InterviewPage.tsx`:**
    -   **Why:** This component is overly complex, managing media, AI sessions, a code editor, and multiple UI states.
    -   **Action:**
        -   Create custom hooks like `useMediaStream()` and `useLiveSessionManager()`.
        -   Extract UI sections into smaller components (e.g., `CallView`, `CodingView`, `ControlBar`, `TranscriptPanel`).

-   [ ] **Implement a Toast Notification System:**
    -   **Why:** Using `alert()` provides a poor and blocking user experience.
    -   **Action:** Integrate a library like `react-hot-toast` or `sonner` to display non-blocking notifications for events like "Profile Saved" or API errors.

---

### New Features & Integrations

These tasks involve completing and integrating planned features.

-   [ ] **Integrate Real-time Feedback Feature:**
    -   **Why:** The services (`geminiForRealtimeAnalysis`, `realtimeAnalysisService`) and UI component (`RealtimeFeedback`) exist but are not used.
    -   **Action:** In `InterviewPage.tsx`, instantiate `RealtimeAnalysisService`, manage its state, and render the `RealtimeFeedback` component with the live analysis results (pace and eye contact).

-   [ ] **Implement Holistic Analysis on Summary Page:**
    -   **Why:** The `geminiForHolisticAnalysis.ts` service is created but never called. This is a missed opportunity for valuable feedback on body language and vocal tone.
    -   **Action:**
        -   In `InterviewPage.tsx`, ensure periodic video frames are captured and saved.
        -   In `InterviewSummaryPage.tsx`, if frames are available, call `generateHolisticAnalysis` and display the results in new "Vocal Delivery" and "Non-Verbal Cues" sections.

---

### Code Quality & Cleanup

General housekeeping for a healthier codebase.

-   [ ] **Add Unit and Integration Tests:**
    -   **Why:** The project currently has no automated tests, making it risky to refactor or add new features.
    -   **Action:** Set up Jest and React Testing Library. Add initial tests for critical components (`AuthModal`) and services (`geminiStartInterview`).

-   [x] **Remove Unused and Empty Files:**
    -   **Why:** The project contains empty service files that add clutter.
    -   **Action:** Deleted `frontend/services/geminiService.ts` and `frontend/services/geminiLiveServiceCombined.ts`.

-   [ ] **Enhance Accessibility (A11y):**
    -   **Why:** Ensure the application is usable by everyone.
    -   **Action:** Perform an audit using browser tools. Ensure all interactive elements are keyboard-focusable, have proper ARIA attributes, and that color contrasts are sufficient.

-   [ ] **Improve User-Facing Error Messages:**
    -   **Why:** Generic error messages can be frustrating for users.
    -   **Action:** Create a centralized error handling utility that maps common API errors to user-friendly messages (e.g., "Our AI is currently busy, please try again in a moment.").