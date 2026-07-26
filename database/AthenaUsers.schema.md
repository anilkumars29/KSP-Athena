# AthenaUsers Catalyst Data Store table

Create a table named `AthenaUsers` before using registration.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `Username` | Var Char | Yes | Set a unique index; recommended maximum length 50 |
| `PasswordHash` | Var Char | Yes | Minimum length 128 |
| `PasswordSalt` | Var Char | Yes | Minimum length 32 |
| `Role` | Var Char | Yes | Maximum length 30 |
| `IsActive` | Boolean | Yes | Default `true` |
| `CreatedAt` | DateTime | Yes | Account creation timestamp |

Do not expose this table directly to the Catalyst web client. Registration and
login must go through the Advanced I/O function.
