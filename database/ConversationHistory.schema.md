# ConversationHistory

Existing Catalyst Data Store table inspected read-only in KS-IntelliPol Development.

| Column | Type | Notes |
|---|---|---|
| ConversationID | int | Unique application message identifier |
| SessionID | int | Groups messages into a conversation |
| UserID | int | Server-derived user identifier |
| Role | text | `user` or `assistant` |
| Content | text | JSON-encoded message text and display metadata |
| Language | text | `en` or `kn` |

Catalyst also supplies `ROWID`, `CREATORID`, `CREATEDTIME`, and `MODIFIEDTIME`.
