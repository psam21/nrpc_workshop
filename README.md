#Installation

```
> npm install
```

Setup a sample .env:
```
export NSEC="<Insert NSEC here>"
export SERVICE_NAME="FORMSTR NRPC BACKEND"
export SERVICE_ABOUT="Example NRPC backend by FORMSTR"
export SERVICE_PICTURE=""
export SERVICE_BANNER=""
```

```
source .env
```

start the app:
```
node dist/app.js
```

# Nostr RPC-over-Events

## Request Event (kind: 22068)

- `author`: caller pubkey
- `tags`:
  - `["p", "<callee_pubkey>"]`
  - `["method", "<method_name>"]`
  - `["param", "<key>", "<value>"]` (repeatable)

## Response Event (kind: 22069)

- `author`: callee pubkey
- `tags`:
  - `["e", "<request_event_id>"]`
  - `["p", "<caller_pubkey>"]`
  - `["status", "<http_status_code>"]`
  - On success:
    - `["result", "<key>", "<value>"]` (repeatable)
    - `["result_json", "<json_string>"]` (optional)
  - On error:
    - `["error", "<http_status_code>", "<message>"]`

## Examples

### Request

```json
{
  "kind": 22068,
  "author": "npub1caller...",
  "tags": [
    ["p", "npub1service..."],
    ["method", "createReminder"],
    ["param", "time", "2025-09-17T09:00:00Z"],
    ["param", "text", "Doctor appointment"],
    ["param", "notify", "true"]
  ],
  "content": ""
}

Success Response

{
  "kind": 22069,
  "author": "npub1service...",
  "tags": [
    ["e", "id_of_request_event"],
    ["p", "npub1caller..."],
    ["status", "200"],
    ["result", "reminder_id", "rem123"],
    ["result", "scheduled_at", "2025-09-17T09:00:00Z"]
  ],
  "content": ""
}

Error Response

{
  "kind": 22069,
  "author": "npub1service...",
  "tags": [
    ["e", "id_of_request_event"],
    ["p", "npub1caller..."],
    ["status", "400"],
    ["error", "400", "invalid time format"]
  ],
  "content": ""
}
```
