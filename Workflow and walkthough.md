# QSTP Connect: Judge Walkthrough Guide
**Module:** Live Demo Script & State Flow

## Preparation
Ensure the judges have downloaded the two provided files from the landing page: `Approved_Intern_Template.pdf` and `Approved_JD_Template.pdf`.

## The 9-Step Walkthrough Flow
1. **Intern Onboarding:** Judge (acting as Intern) uploads `Approved_Intern_Template.pdf`. The system parses it. A chatbot appears asking 2-3 missing QSTP form questions. Profile completes.
2. **Startup Needs:** Judge (acting as Startup) uploads `Approved_JD_Template.pdf`. A chatbot prompts for missing metadata (e.g., "Is this for 20 or 40 hours/week?"). 
3. **Bring Your Own Candidate (BYOC):** Startup clicks "Bring Your Own Candidate" and inputs a mock email. State updates to `Pending QSTP Approval`.
4. **Admin Oversight:** Judge switches to QSTP Admin view. Clicks "Approve" on the BYOC request.
5. **The Match:** Judge switches back to Intern view. The AI Matchmaking feed populates, showing the Startup from Step 2 as a top match. Intern clicks "Apply".
6. **Startup Review:** Judge switches to Startup view. They see the Intern in their pipeline. 
   - *Test Failure:* Judge clicks "Reject" without feedback -> System throws Error: "Feedback is mandatory."
   - *Test Success:* Judge enters respectful feedback OR clicks "Advance to Offer".
7. **Contract Signing:** Judge switches to QSTP Admin view. Clicks "Generate Contract." The contract appears. Admin signs via live canvas drawing.
   - Switch to Startup -> Signs via Canvas.
   - Switch to Intern -> Signs via Canvas.
8. **Finalization:** Contract UI updates to "Executed." A "Download PDF" button becomes active in the Startup and Intern profiles.
9. **The Master View:** Judge switches to QSTP Admin. The dashboard now reflects the updated metrics (e.g., +1 Offer Made, +1 Contract Executed) proving full ecosystem visibility.

---
### 🛠️ DevNotes: Hardcoded Walkthrough Implementation
* **State Management:** Use `localStorage` to pass flags between these views. E.g., `localStorage.setItem('step6_completed', 'true')`. When the Admin view loads, it checks this flag to render the "Generate Contract" button.
* **Error Handling Enforcement:** The rejection feedback `textarea` validation is critical. `if(textarea.value.length < 5) { showToast('Constructive feedback is required to maintain QSTP standards.'); }`