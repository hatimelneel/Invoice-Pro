Invoice Pro — ACCOUNT PAYMENT FIX
Build: 2026.09.10-ACCOUNT-PAYMENT-FIX

This build keeps the working navigation and backup-only module.
Fix:
- A payment entered from Customer Statement is an ACCOUNT PAYMENT.
- It does not modify any invoice's own Paid/Balance fields.
- Statement Total Paid = paid inside invoices + separate account payments.
- Statement Outstanding = Total Invoiced - Total Paid.
- Account payments appear as independent rows in the statement and PDF.
- Automatic daily backup remains enabled.
- No Restore/Import code is included.

Example:
Total invoiced: 508.816 OMR
Paid inside invoices: 383.000 OMR
Account payment: 100.000 OMR
Total paid: 483.000 OMR
Outstanding: 25.816 OMR


Build 2026.09.10-SAFE-RESTORE
- Transactional backup restore with validation
- Safety snapshot before replacement
- Automatic rollback if restored data breaks startup/navigation
- Preserves account-payment behavior and daily backup

Build 2026.09.10-REORDER-ARROWS
- Added Up/Down arrow controls for invoice items and quotation items.
- Reordering is preserved in preview, saved document, edit mode, and PDF because item array order is saved unchanged.
- Existing SAFE-RESTORE, backup, account payment, and statement logic retained.
