# Feature 3: QSTP Automation Hub
**Module:** Ecosystem Operations

## Overview
The administrative powerhouse of QSTP Connect. This hub handles the heavy operational lifting—transforming successful matches into legally compliant, fully onboarded interns without manual paperwork.

## Key Capabilities
1. **Bulk Operations:** QSTP Admins can mass-invite University candidates via email batches based on university portal uploads.
2. **Auto-Contract Generation:** Upon candidate acceptance, the system dynamically generates the correct contract type (Paid QSTP Intern vs. Unpaid Work Placement) pre-filled with the candidate and startup data.
3. **Digital Auth & Signatures:** A built-in e-signature workflow. 
   - Notifies Startup, Intern, and QSTP Admin.
   - Allows live drawing on an HTML canvas or PNG upload.
   - Time-and-date stamps the signature block.
4. **Payroll & Compliance Prep:** (Placeholder) Finalizes the record for seamless export to BambooHR and payroll systems.

---
### 🛠️ DevNotes: Hardcoded Walkthrough Implementation
* **Canvas Signature:** Use a basic HTML5 `<canvas>` for the signature pad. When the user clicks "Sign", convert it to a base64 image (`canvas.toDataURL()`) and inject it into the mock contract DOM element.
* **Status Toggles:** Create a visible timeline UI (`Draft -> Startup Signed -> Intern Signed -> Executed`). Use click events to advance this timeline instantly during the demo.