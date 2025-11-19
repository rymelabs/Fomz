# Agentic AI Form Builder Execution Plan

## 1. Setup & Configuration
- [x] Install `@mistralai/mistralai` package.
- [x] Create `src/services/aiService.js` to handle API communication.
  - Implement `generateFormFromPrompt(prompt)` function using Mistral AI.
  - Define the system prompt to ensure JSON output matches Fomz schema.

## 2. State Management
- [x] Update `src/store/formBuilderStore.js`:
  - Add `generateForm` action.
  - Add `isGenerating` state.
  - Add logic to populate the store with the returned JSON structure.

## 3. UI Implementation
- [ ] Create `src/components/dashboard/AIGeneratorModal.jsx`:
  - Modal component with a textarea for the user's prompt.
  - "Generate Form" button.
  - Loading state with a creative animation (e.g., "Thinking...").
- [ ] Update `src/pages/Dashboard/MyForms.jsx`:
  - Add a "Create with AI" button next to the existing "Create Form" button.
  - Wire up the button to open the `AIGeneratorModal`.

## 4. Integration & Logic
- [ ] Connect `AIGeneratorModal` to `formBuilderStore`.
- [ ] On success:
  - Initialize the form in the store.
  - Save the form to Firebase (optional, or just let user save).
  - Navigate to the Builder page (`/builder`) with the new form loaded.

## 5. Testing & Refinement
- [ ] Test with sample prompts (e.g., "Registration form", "Customer satisfaction survey").
- [ ] Handle errors (invalid JSON, API limits).
