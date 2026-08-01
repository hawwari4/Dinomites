# Feature 2: AI-Based Matchmaking (Zero-Touch Pairing)
**Module:** The Engine Room

## Overview
A completely hands-off matching ecosystem for QSTP, Universities, Interns, and Startups. The platform eliminates manual CV screening by matching candidates directly to startup requirements based on skill keywords, availability, and project needs.

## Key Capabilities
1. **The JD Pot:** Startups upload their Job Descriptions directly into the portal. The system parses requirements including:
   - Number of interns needed.
   - Commitment (Part-time 20hrs vs. Full-time 40hrs).
   - Technical & soft skill keywords.
2. **Algorithmic Scoring:** The system compares the Intern's parsed profile against the active JD Pot, generating a "Match Percentage."
3. **Bi-Directional Visibility:** Interns see a feed of highly matched startups; Startups see a ranked pipeline of perfectly suited candidates.

---
### 🛠️ DevNotes: Hardcoded Walkthrough Implementation
* **JD Upload Mock:** Similar to the intern CV, restrict the JD upload. 
  * *Logic:* `if (file.name !== 'Approved_JD_Template.pdf') { showError("Please use approved template"); return; }`
* **Match Simulation:** When the judge logs in as an Intern, the dashboard should immediately fetch the hardcoded startup ("Nabta Health") and display an `88% Match` badge.
* **UI State:** Hide all other startups behind a "Loading other matches..." skeleton screen to focus the judge's attention purely on the happy path.