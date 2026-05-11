# Firebase Security Specification - CoupleCash

## 1. Data Invariants
- A `User` can only be linked to one `coupleId`.
- `Transaction` entries must belong to a `coupleId` that includes the `request.auth.uid`.
- `Debt` entries must belong to a `coupleId` that includes the `request.auth.uid`.
- `members` in a `Couple` document must contain exactly 2 unique UIDs for a completed link.
- `inviteCode` must be unique and generated for each user.

## 2. Dirty Dozen Payloads (Rejection Targets)
1. Creating a transaction for a couple you aren't in.
2. Modifying another user's private profile.
3. Increasing another person's debt without being the lender.
4. Deleting a shared debt if you aren't the lender/borrower.
5. Setting your own `isAdmin` flag (not used yet, but good for future).
6. Changing the `date` of an old transaction to a future date to game stats (some apps block this).
7. Injecting 1MB of text into a category name.
8. Joining a couple by just writing your UID into someone else's couple document.
9. Reading all global transactions.
10. Creating a couple with 3 members.
11. Updating `createdAt` on an existing transaction.
12. Repaying a debt with a negative amount.

## 3. Test Runner Plan
Using `firestore.rules.test.ts` to verify these constraints. (Skipped detailed code here but implemented in logic).
