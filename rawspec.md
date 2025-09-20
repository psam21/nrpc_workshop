```json

{
    "kind": 22068,
    "tags": [
        ["p", "npub1callee..."], // target/callee
        ["method", "getProfile"],
        ["param", "pubkey", "npub1target..."],
        ["param", "include_relays", "true"]
    ],
    "content": ""
}

{
    "kind": 22069,
    "tags": [
        ["e", "id_of_request_event"], // links response to request
        ["p", "npub1caller..."], // target/original requester
        ["result", "name", "Alice"],
        ["result", "about", "nostrich"],
        ["result_json", "{\"relays\": [\"wss://...\", \"wss://...\"]}"]
        // optional error example:
        // ["error", "not_found", "profile does not exist"]
    ],
    "content": ""
}

```

```json
{
  "kind": 22068,
  "author": "npub1caller...",
  "tags": [
    ["p", "npub1reminderservice..."], // the callee
    ["method", "createReminder"],
    ["param", "time", "2025-09-17T09:00:00Z"],
    ["param", "text", "Doctor appointment"],
    ["param", "notify", "true"]
  ],
  "content": ""
}

{
  "kind": 22069,
  "author": "npub1reminderservice...",
  "tags": [
    ["e", "id_of_request_event"],           // reference request
    ["p", "npub1caller..."],                // back to requester
    ["result", "status", "ok"],
    ["result", "reminder_id", "rem123"],
    ["result", "scheduled_at", "2025-09-17T09:00:00Z"]
  ],
  "content": ""
}

{
  "kind": 22069,
  "author": "npub1reminderservice...",
  "tags": [
    ["e", "id_of_request_event"],
    ["p", "npub1caller..."],
    ["error", "invalid_param", "time format not recognized"]
  ],
  "content": ""
}
```
