# AI Workflow

AI assistance was used as a development aid throughout the implementation.

## How AI Was Used

ChatGPT was used for:

- Breaking the assignment into an achievable implementation plan
- Choosing a lightweight full-stack architecture
- Planning the Supabase schema
- Debugging API and deployment issues
- Providing targeted implementation guidance
- Reviewing errors and suggesting fixes
- Helping structure the final documentation

## Development Approach

The project was intentionally built incrementally rather than generating the entire application at once.

The workflow was:

1. Set up the React/Vite frontend.
2. Add TipTap for rich-text editing.
3. Set up the Express backend.
4. Connect the backend to Supabase.
5. Create the database schema and seed users.
6. Build and test document APIs.
7. Connect the dashboard to the API.
8. Add saving and reopening.
9. Add document sharing.
10. Add file import.
11. Add automated tests.
12. Build and deploy the frontend and backend.
13. Perform production validation.

## Verification

AI-generated suggestions were treated as implementation guidance rather than blindly accepted code.

The application was manually tested through the UI and API during development.

The production build completed successfully and the automated test suite passed with:

- 1 test file
- 2 tests
- 2 passing
- 0 failing

## What Was Prioritized

The implementation prioritized the assignment's required workflows:

- document creation
- editing
- persistence
- file import
- sharing
- owned/shared document views

Stretch features such as real-time collaboration, comments, version history, and production authentication were deliberately left out to maintain a reliable core implementation.