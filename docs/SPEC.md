# Mutual Layoff Support Fund — Application Specification

## 1. Overview

A web application to manage the Mutual Layoff Support Fund. It handles member
management, monthly contributions, claims, payouts, queue management, governance
voting, and reporting — all aligned to the fund's written rules.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| ORM | Prisma |
| Auth | Supabase Auth — Email Magic Link + Google OAuth |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Deployment | Vercel (free tier) |

---

## 3. Authentication & Roles

### Login Methods
- Email magic link (passwordless)
- Google OAuth

### Roles
| Role | Description |
|---|---|
| `pending` | Registered but not yet approved by trustees |
| `member` | Active, paying member |
| `suspended` | Missed 2+ months of contributions |
| `office_staff` | Covered without contributions, reduced payout |
| `trustee` | Runs the fund, approves payments |

### Auth Flow
1. User enters email or signs in with Google
2. If new user → profile completion form (name, phone) + digital pledge
3. Trustees review and approve → role set to `member`
4. If existing user → straight to dashboard after magic link / OAuth

### Rules Enforced
- Cannot join after receiving a termination notice
- Trustees cannot approve a member who has an active termination notice
- Suspended members cannot log in — their account is locked until reinstated by a trustee

---

## 4. Database Schema (Entities)

### members
- id, user_id (Supabase auth), name, phone, email
- role: pending | member | suspended | office_staff | trustee
- joined_at, approved_at, left_at
- pledge_signed_at

### contributions
- id, member_id, month (YYYY-MM), amount, paid_at, status: on_time | late | missed
- recorded_by (trustee_id — null if self-reported, trustee id if entered on behalf of member)

### claims
- id, member_id, notice_date, notice_period_end_date
- type: layoff | forced_resignation
- status: pending | approved | rejected | waiting | active | completed | closed
- queue_position, queue_entered_at
- approved_by (trustee_id), approved_at
- filed_by (trustee_id — null if self-filed, trustee id if filed on behalf of member or office staff)

### payouts
- id, claim_id, member_id, month_number (1 or 2), amount
- status: pending | approved | transfer_uploaded | paid
- approved_by_1, approved_by_2 (trustee ids)
- transfer_document_url (supporting document uploaded after bank transfer)
- transfer_uploaded_by (trustee_id), transfer_uploaded_at
- payment_confirmed_by (trustee_id — the approving trustee who marks it paid), paid_at

### votes
- id, proposal_id, member_id, vote: yes | no | abstain, voted_at

### proposals
- id, type: rule_change | trustee_election | add_office_staff
- title, description, proposed_by, proposed_at
- status: open | passed | failed | cancelled
- voting_deadline, result_applied_at

### monthly_reports
- id, month (YYYY-MM), total_in, total_out, balance
- active_members, suspended_members, members_in_arrears
- published_at, published_by

---

## 5. Modules & Pages

### 5.1 Member Portal

**Dashboard** `/dashboard`
- 4 hero stat tiles: Fund Balance | Active Members | In Queue | Receiving Help
- Own contribution status (paid / due / missed)
- Own claim status and queue position (if applicable)
- Notifications panel

**Profile** `/profile`
- View/edit name, phone
- Pledge status
- Contribution history table

**Claim** `/claim`
- Submit a new layoff claim
- Upload supporting document (optional)
- View claim status and queue position

### 5.2 Contributions

**My Contributions** `/contributions`
- Monthly table: month, amount, paid date, status
- Due this month alert if unpaid

### 5.3 Queue & Payouts (public to all members)

**Waiting List** `/queue`
- Table: member number (not name), date entered queue, position, status
- Updated by the 10th each month

### 5.4 Trustee Dashboard `/trustee`

Access restricted to trustees only.

**Overview**
- Fund balance
- Pending approvals count
- Members in arrears
- This month's payout obligations

**Member Management** `/trustee/members`
- List all members with role and contribution status
- Approve pending members
- Suspend members (auto-triggered at 2 missed months, manual override)
- Add/remove office staff (requires majority vote)

**Claims Management** `/trustee/claims`
- Review submitted claims
- Approve or reject claims
- Assign to queue on approval
- **File claim on behalf of any member or office staff**: select member, enter notice date, type, supporting details — trustee id logged as filed_by

**Monthly Cycle** `/trustee/cycle`
- Run monthly cycle (5th: lock queue, calculate payouts)
- Review and approve payout list (requires 2-of-3 trustee approvals)
- Publish monthly report (10th)

**Contributions Tracking** `/trustee/contributions`
- All members' payment status per month
- Flag late/missed
- Auto-suspension trigger at 2 consecutive missed months
- **Record contribution on behalf of member**: select member, enter amount (PKR 10,000), date paid, month — trustee id logged automatically

### 5.5 Governance `/votes`

- List of open and past proposals
- Vote YES/NO on open proposals
- Create new proposal (members can propose, trustees execute)
- Results shown after deadline
- Rule: anyone not voting YES within deadline = counted as NO
- Two-thirds of ALL members required for rule changes
- Simple majority of voters for trustee elections and office staff additions

### 5.6 Reports `/reports`

Monthly report (published by 10th):
- Money in, money paid out, balance
- Active member count, members in arrears
- Waiting list (member numbers only)

Annual audit:
- Full bank statement reconciliation
- 2 randomly selected members review (audit log visible)

---

## 6. Charts & Analytics `/analytics`

| Chart | Type | Data |
|---|---|---|
| Fund Balance over time | Area chart | Monthly balance |
| Contributions vs Payouts | Grouped bar | Monthly in vs out |
| Runway indicator | Stat tile | Months of payout capacity |
| Member count over time | Line chart | Active / suspended / left |
| Contribution compliance | Stacked bar | On-time / late / missed per month |
| Member breakdown | Donut chart | Active / suspended / waiting / receiving |
| Layoffs over time | Bar chart | Claims per month |
| Average queue wait | Line chart | Days from notice to first payment |
| Payout status | Stat tiles | Month-1 / Month-2 / On queue / Total paid |

---

## 7. Business Logic

### Monthly Cycle (runs on the 5th)
1. Lock the queue — no new entries processed until next cycle
2. Identify members already receiving month-2 → pay them first
3. Identify members already receiving month-1 → move to month-2 if fund allows
4. Take next person(s) from queue → start month-1 if fund allows
5. Office staff: at most 1 starts per month, paid ahead of regular members if fund can cover both months
6. Trustees approve payout list (2-of-3 required)
7. Trustee makes bank transfer manually, then uploads transfer document in app
8. A trustee reviews the uploaded document and marks payout as paid
9. Monthly report published by 10th

### Queue Ordering
1. Date notice period started (earliest first)
2. Tie: member who joined the fund earlier
3. Still tied: lots drawn in front of witnesses (manual, recorded by trustee)

### Suspension
- 2 missed monthly contributions → auto-suspend
- Suspended members cannot log in — account locked
- Suspended members are ineligible for any payout, even if laid off while suspended
- Trustee can manually reinstate a suspended member (logged with reason)

### Contributions Pause
- Members on the waiting list or actively receiving help do not pay contributions

### Fund Start Condition
- Fund only becomes operational when balance ≥ PKR 200,000

### Payout Amounts
- Regular member: PKR 200,000/month × 2 months = PKR 400,000 total
- Office staff: PKR 100,000/month × 2 months = PKR 200,000 total
- Payouts stop if member finds new job before completing 2 months

---

## 8. Notifications

| Event | Recipient | Channel |
|---|---|---|
| Contribution due (1st of month) | All active members | Email |
| Contribution overdue (6th) | Member | Email |
| Suspended (2 missed) | Member | Email |
| Claim approved / rejected | Member | Email |
| Queue position update | Member | Email |
| Payout sent | Member | Email |
| New proposal to vote on | All members | Email |
| Voting deadline reminder | All members | Email |
| Monthly report published | All members | Email |
| New member pending approval | Trustees | Email |

---

## 9. Access Control Summary

| Feature | Member | Trustee | Office Staff |
|---|---|---|---|
| View own dashboard | ✅ | ✅ | ✅ |
| Submit own claim | ✅ | ✅ | ✅ |
| File claim on behalf of member | ❌ | ✅ | ❌ |
| Record contribution on behalf of member | ❌ | ✅ | ❌ |
| Upload transfer document | ❌ | ✅ | ❌ |
| Confirm payment (mark as paid) | ❌ | ✅ | ❌ |
| View queue (numbers only) | ✅ | ✅ | ✅ |
| View analytics | ✅ | ✅ | ✅ |
| Vote on proposals | ✅ | ✅ | ❌ |
| Approve members | ❌ | ✅ | ❌ |
| Approve payouts | ❌ | ✅ | ❌ |
| Run monthly cycle | ❌ | ✅ | ❌ |
| Publish reports | ❌ | ✅ | ❌ |
| Create proposals | ✅ | ✅ | ❌ |

---

## 10. Non-Functional Requirements

- Mobile-first responsive design
- All PKR amounts formatted with commas (e.g. PKR 200,000)
- Dates in DD/MM/YYYY format
- All actions by trustees are logged with timestamp and trustee ID
- Transfer document upload (PDF/image) per payout — stored in Supabase Storage
- Bank statement upload (PDF/CSV) for monthly reconciliation
- Data export: member list, contribution history, payout history (CSV)
- Audit log visible to any member on request

---

## 11. Out of Scope (Phase 1)

- Automated bank transfers (manual payments, app just tracks)
- Mobile app (web only, responsive)
- Multi-fund support
- WhatsApp notifications (email only for now)
