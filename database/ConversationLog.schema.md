# Persistent audit trail storage

The live project stores signed operational audit events in the existing
`ConversationHistory` table because `ConversationLog` is not provisioned.
Rows are isolated from ordinary conversations using `Language = audit-v1`.

| `ConversationHistory` column | Type | Audit usage |
|---|---|---|
| `ConversationID` | int | Random audit event identifier in the 1,000,000,000+ range |
| `UserID` | int | Stable server-derived actor identifier |
| `Role` | text | Authenticated role |
| `SessionID` | int | Same audit event identifier |
| `Content` | text | Action, metadata, timestamp, and HMAC integrity signature |
| `Language` | text | Format marker: `audit-v1` |
| `CREATEDTIME` | system datetime | Catalyst insertion timestamp used for ordering |

No password, session token, full chat query, or full victim statement is stored.
Audit reads are restricted to Supervisor and Argos by the Advanced I/O function.
