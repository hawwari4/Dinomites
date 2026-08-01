import { Download, FileCheck2 } from 'lucide-react'
import Modal from './Modal'

const STEPS = [
  {
    title: 'Intern Onboarding',
    body: "Sign in as Intern and upload Approved_Intern_Template.pdf. The system parses it — a chatbot asks 2-3 missing QSTP form questions, then the profile completes.",
  },
  {
    title: 'Startup Needs',
    body: 'Sign in as Startup and upload Approved_JD_Template.pdf. A chatbot prompts for missing metadata (e.g. "Is this for 20 or 40 hours/week?").',
  },
  {
    title: 'Bring Your Own Candidate (BYOC)',
    body: 'As Startup, click "Bring Your Own Candidate" and enter a mock email. The state updates to Pending QSTP Approval.',
  },
  {
    title: 'Admin Oversight',
    body: 'Switch to QSTP Admin and click "Approve" on the BYOC request.',
  },
  {
    title: 'The Match',
    body: 'Switch back to Intern — the AI Matchmaking feed populates, showing the Startup from Step 2 as a top match. Click "Apply".',
  },
  {
    title: 'Startup Review',
    body: 'Switch to Startup — the Intern now appears in the pipeline. Clicking "Reject" without feedback throws "Feedback is mandatory." Enter respectful feedback, or click "Advance to Offer" to proceed.',
  },
  {
    title: 'Contract Signing',
    body: 'Switch to QSTP Admin and click "Generate Contract." Sign via the live canvas, then switch to Startup and sign, then switch to Intern and sign.',
  },
  {
    title: 'Finalization',
    body: 'The contract UI updates to "Executed." A "Download PDF" button becomes active in both the Startup and Intern profiles.',
  },
  {
    title: 'The Master View',
    body: 'Switch to QSTP Admin — the dashboard reflects the updated metrics (e.g. +1 Offer Made, +1 Contract Executed), proving full ecosystem visibility.',
  },
]

const TEMPLATES = [
  { name: 'Approved_Intern_Template.pdf', href: '/Approved_Intern_Template.pdf' },
  { name: 'Approved_JD_Template.pdf', href: '/Approved_JD_Template.pdf' },
]

export default function WalkthroughGuide({ onClose }) {
  return (
    <Modal title="Judge Walkthrough Guide" size="lg" onClose={onClose}>
      <div className="space-y-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Preparation</div>
          <p className="text-sm text-slate-600 mb-3">Download these two sample files, then use them in Steps 1 and 2 below.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            {TEMPLATES.map((t) => (
              <a
                key={t.name}
                href={t.href}
                download
                className="flex-1 inline-flex items-center gap-2 text-sm font-medium bg-qstp-50 border border-qstp-200 text-qstp-700 px-3 py-2 rounded-lg hover:bg-qstp-100"
              >
                <Download className="w-4 h-4 shrink-0" /> {t.name}
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">The 9-Step Walkthrough Flow</div>
          <ol className="space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <div className="w-6 h-6 shrink-0 rounded-full bg-qstp-500 text-white text-xs font-bold grid place-items-center mt-0.5">
                  {i + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                  <div className="text-sm text-slate-600 leading-snug mt-0.5">{s.body}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-lg p-3">
          <FileCheck2 className="w-4 h-4 text-qstp-600 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-snug">
            Use the role switcher to move between Intern, Startup, and QSTP Admin at each step — every action updates shared state, so switching views reflects the latest progress.
          </p>
        </div>
      </div>
    </Modal>
  )
}
