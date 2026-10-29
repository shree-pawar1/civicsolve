# CivicSolve — Specifications & Workflow Documentation
**Assignment 8 Specification Reference & System Architecture**

## 1. System Vision
CivicSolve connects four key societal stakeholders into a unified problem-solving ecosystem:
1. **Citizens**: Identify and report real-world problems in their local communities, track resolution, and support proposed solutions.
2. **Universities (Academia)**: Provide research-backed solution proposals, feasibility studies, and academic collaboration.
3. **Industries**: Offer technical recommendations, corporate social responsibility (CSR) support, technology expertise, and implementation resources.
4. **Government Organizations**: Review reported challenges, moderate and approve solutions, coordinate execution, change problem statuses through official transitions, and publish verifiable progress timelines.

---

## 2. Stakeholder Permissions & Role-Based Access Control

| Feature / Action | CITIZEN | UNIVERSITY | INDUSTRY | GOVERNMENT |
|---|---|---|---|---|
| Register / Login | Yes | Yes (Org req.) | Yes (Org req.) | Yes (Org req.) |
| Create Problem | Yes | No | No | No |
| View Problems & Details | Yes | Yes | Yes | Yes |
| Edit / Delete Problem | Own only (if SUBMITTED) | No | No | No |
| Submit Solution Proposal | No | Yes (`PROPOSAL`) | No | No |
| Submit Tech Recommendation | No | No | Yes (`RECOMMENDATION`) | No |
| Edit / Withdraw Own Solution | No | Yes (own) | Yes (own) | No |
| Support / Upvote Solution | Yes (1 per user/sol) | No | No | No |
| Change Problem Status | No | No | No | Yes |
| Post Progress Update | No | No | No | Yes |
| Review Solution Status | No | No | No | Yes (Accept/Reject) |

---

## 3. Workflow State Machine

### Problem Status Lifecycle:
- `SUBMITTED`: Newly created by a Citizen.
- `UNDER_REVIEW`: Government is evaluating severity, jurisdiction, and priority.
- `IN_PROGRESS`: Government or partnering stakeholders are actively implementing solutions.
- `RESOLVED`: Problem is solved with verified outcomes.
- `CLOSED`: Rejected or closed (e.g. invalid, duplicate, out-of-jurisdiction).

**Allowed Transitions:**
- `SUBMITTED` -> `UNDER_REVIEW`
- `SUBMITTED` -> `CLOSED`
- `UNDER_REVIEW` -> `IN_PROGRESS`
- `UNDER_REVIEW` -> `CLOSED`
- `IN_PROGRESS` -> `RESOLVED`
- `IN_PROGRESS` -> `CLOSED`

Every status change MUST record an atomic `ProgressUpdate` containing `fromStatus`, `toStatus`, `authorId`, and a non-empty `message`.

---

## 4. UI / UX Design Specifications
- **Color Palette**:
  - Primary: `#1976D2` (Civic Blue)
  - Primary Dark: `#0D47A1` (Deep Indigo)
  - Secondary / Accent: `#26A69A` (Teal)
  - Background: `#F5F7FA` (Cool Grey)
  - Surface: `#FFFFFF` (Pure White)
  - Text Primary: `#333333` (Charcoal)
  - Text Muted: `#666666`
  - Border: `#E0E0E0`
  - Success: `#2E7D32`
  - Warning: `#ED6C02`
  - Danger: `#D32F2F`
- **Typography**: Clean modern sans-serif (Inter / system modern font stack).
- **Responsive**: Fully functional on desktop, tablet, and mobile displays.
- **Empty & Loading States**: Clean informative placeholders when lists are empty ("No problems have been reported yet.", "No solutions submitted yet.").
