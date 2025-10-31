# NRPC Server - Nostr RPC-over-Events# Installation



A complete implementation of NRPC (Nostr Remote Procedure Call) server with support for reminders, direct messaging, scheduled posts, and ecash giveaways.```

> npm install

## 🚀 Features```



- **NRPC Protocol** - Implements kinds 22068 (request) and 22069 (response)Setup a sample .env:

- **Encrypted Communication** - Supports NIP-17 gift wrapping and NIP-04 fallback```

- **Multiple Controllers** - Modular design with specialized controllersexport NSEC="<Insert NSEC here>"

- **Scheduling System** - Built-in scheduler for reminders and postsexport SERVICE_NAME="FORMSTR NRPC BACKEND"

- **Ecash Integration** - Cashu wallet for token giveawaysexport SERVICE_ABOUT="Example NRPC backend by FORMSTR"

- **Method Introspection** - Auto-discovery via `getMethods`export SERVICE_PICTURE=""

- **SQLite Persistence** - Reliable data storageexport SERVICE_BANNER=""

- **Daemon Mode** - Run as background service```



## 📋 Table of Contents```

source .env

- [Installation](#installation)```

- [Configuration](#configuration)

- [Running the Server](#running-the-server)start the app:

- [Available Methods](#available-methods)```

- [NRPC Protocol](#nrpc-protocol)node dist/app.js

- [Testing Tools](#testing-tools)```

- [Project Structure](#project-structure)

- [Development](#development)# Nostr RPC-over-Events



## 💿 Installation## Request Event (kind: 22068)



```bash- `author`: caller pubkey

# Clone the repository- `tags`:

git clone https://github.com/psam21/nrpc_workshop.git  - `["p", "<callee_pubkey>"]`

cd nrpc_workshop  - `["method", "<method_name>"]`

  - `["param", "<key>", "<value>"]` (repeatable)

# Install dependencies

npm install## Response Event (kind: 22069)

```

- `author`: callee pubkey

## ⚙️ Configuration- `tags`:

  - `["e", "<request_event_id>"]`

Create a `.env` file in the root directory:  - `["p", "<caller_pubkey>"]`

  - `["status", "<http_status_code>"]`

```bash  - On success:

# Required: Your Nostr private key    - `["result", "<key>", "<value>"]` (repeatable)

export NSEC="nsec1..."    - `["result_json", "<json_string>"]` (optional)

  - On error:

# Optional: Your public key (auto-derived if not provided)    - `["error", "<http_status_code>", "<message>"]`

export PUBKEY="your_hex_pubkey"

## Examples

# Service Information

export SERVICE_NAME="My NRPC Server"### Request

export SERVICE_ABOUT="Remote Procedure Call server over Nostr"

export SERVICE_PICTURE="https://example.com/logo.png"```json

export SERVICE_BANNER="https://example.com/banner.png"{

  "kind": 22068,

# Nostr Relays (comma-separated)  "author": "npub1caller...",

export RELAYS="wss://relay.damus.io,wss://relay.snort.social,wss://relay.primal.net,wss://relay.nostr.band"  "tags": [

    ["p", "npub1service..."],

# Optional: Ecash Giveaway (requires mint URL)    ["method", "createReminder"],

export MINT_URL="https://mint.minibits.cash/Bitcoin"    ["param", "time", "2025-09-17T09:00:00Z"],

    ["param", "text", "Doctor appointment"],

# Optional: Lightning & Social    ["param", "notify", "true"]

export LUD16="you@getalby.com"  ],

export WEBSITE="https://yourwebsite.com"  "content": ""

export NIP05="you@yourdomain.com"}



# Server Port (default: 3000)Success Response

export PORT="3000"

```{

  "kind": 22069,

### Setting Up Ecash Giveaway (Optional)  "author": "npub1service...",

  "tags": [

If you want to enable the giveaway feature:    ["e", "id_of_request_event"],

    ["p", "npub1caller..."],

1. **Set MINT_URL** in your `.env`    ["status", "200"],

2. **Get an ecash token** from a Cashu mint    ["result", "reminder_id", "rem123"],

3. **Add token to environment**:    ["result", "scheduled_at", "2025-09-17T09:00:00Z"]

   ```bash  ],

   export ECASH_TOKEN="cashuA..."  "content": ""

   ```}

4. **Seed the wallet**:

   ```bashError Response

   npm run seed

   ```{

  "kind": 22069,

## 🏃 Running the Server  "author": "npub1service...",

  "tags": [

### Development Mode    ["e", "id_of_request_event"],

    ["p", "npub1caller..."],

```bash    ["status", "400"],

# Load environment variables    ["error", "400", "invalid time format"]

source .env  ],

  "content": ""

# Build TypeScript}

npm run build```


# Start server
npm start
```

### Development with Auto-reload

```bash
npm run dev
```

### Daemon Mode (Background)

```bash
npm start -- -d
```

This will:
- Run the server in background
- Create `nrpc.pid` with process ID
- Log to `output.log`

To stop the daemon:
```bash
pkill -f "node dist/app.js"
```

## 🔧 Available Methods

### 1. **createReminder**
Schedule a reminder to be sent via DM at a specific time.

**Parameters:**
- `Time` (required): Time in format "HH:MM"
- `Text` (required): Reminder message
- `Date` (required): Date in format "YYYY-MM-DD"

**Returns:**
- `reminder_id`: Unique identifier
- `scheduled_at`: ISO timestamp
- `text`: Reminder message
- `owner`: Creator's pubkey

**Errors:**
- `400`: Invalid time/date format or missing parameters

### 2. **sendDM**
Send a direct message to the caller.

**Parameters:** None

**Returns:**
- Empty object (success confirmation)

### 3. **sendSecureDM**
Send a secure direct message with humility check.

**Parameters:**
- `Are you humble?` (required): Must be "Yes"

**Returns:**
- `message`: "User is humble"

**Errors:**
- `400`: User is not humble (answered anything other than "Yes")

### 4. **schedulePost**
Schedule a Nostr event to be published at a future time.

**Parameters:**
- `When do you want it posed?` (required): Unix timestamp
- `Say something!` (required): Nostr event JSON

**Returns:**
- `post_id`: Job identifier
- `scheduled_at`: ISO timestamp
- `event_kind`: Kind of scheduled event
- `event_id`: Event ID

### 5. **giveaway** (if MINT_URL configured)
Claim a free ecash token (1 sat per pubkey, once only).

**Parameters:**
- `I want to receive ecash!` (required): Nostr event JSON

**Returns:**
- `token`: Cashu token string
- `pubkey`: Claimer's pubkey
- `message`: Success message (also sent via DM)

**Errors:**
- `400`: Already claimed
- `400`: Insufficient funds
- `500`: Internal error

### 6. **alwaysError**
Test endpoint that always throws an error.

**Parameters:**
- `message` (optional): Custom error message

**Errors:**
- `400`: Always fails

### 7. **getMethods**
Returns introspection data for all available methods.

**Parameters:** None

**Returns:**
- Array of method specifications with params, returns, and errors

## 📡 NRPC Protocol

### Request Event (kind: 22068)

```json
{
  "kind": 22068,
  "pubkey": "caller_pubkey",
  "created_at": 1234567890,
  "tags": [
    ["p", "server_pubkey"],
    ["method", "createReminder"],
    ["param", "Time", "09:00"],
    ["param", "Text", "Doctor appointment"],
    ["param", "Date", "2025-11-01"]
  ],
  "content": "",
  "id": "...",
  "sig": "..."
}
```

### Success Response (kind: 22069)

```json
{
  "kind": 22069,
  "pubkey": "server_pubkey",
  "created_at": 1234567890,
  "tags": [
    ["e", "request_event_id"],
    ["p", "caller_pubkey"],
    ["status", "200"],
    ["result", "reminder_id", "abc123"],
    ["result", "scheduled_at", "2025-11-01T09:00:00Z"]
  ],
  "content": "",
  "id": "...",
  "sig": "..."
}
```

### Error Response (kind: 22069)

```json
{
  "kind": 22069,
  "pubkey": "server_pubkey",
  "created_at": 1234567890,
  "tags": [
    ["e", "request_event_id"],
    ["p", "caller_pubkey"],
    ["status", "400"],
    ["error", "400", "time and text required"]
  ],
  "content": "",
  "id": "...",
  "sig": "..."
}
```

### Encrypted Requests (NIP-17 Gift Wrap)

The server also supports encrypted requests using:
- **kind: 21169** - Gift wrap
- **kind: 68** - Request rumor (encrypted)
- **kind: 69** - Response rumor (encrypted)

## 🧪 Testing Tools

### 1. NRPC Dashboard (`test-nrpc-client.html`)

Interactive web dashboard to:
- Discover NRPC servers on relays
- Check available methods via `getMethods`
- View server profiles and metadata

**Usage:**
```bash
xdg-open test-nrpc-client.html
# or on Mac: open test-nrpc-client.html
```

### 2. Ecash Claim Tool (`claim-ecash.html`)

Browser-based tool to claim ecash tokens from giveaway servers.

**Features:**
- Pre-configured with known NRPC servers
- Dynamic method signature detection
- 30-second timeout
- Clear error messages

**Usage:**
```bash
xdg-open claim-ecash.html
```

### 3. Server Status Checker (`test-server-status.html`)

Diagnostic tool to test if NRPC servers are online and responding.

**Tests:**
- Profile metadata (kind 0)
- `getMethods` response
- 20-second timeout per server

## 📁 Project Structure

```
nrpc_server/
├── src/
│   ├── app.ts                    # Main entry point
│   ├── config.ts                 # Configuration loader
│   ├── registry.ts               # Method registry
│   ├── utils.ts                  # Utilities (signing, keys)
│   ├── controllers/
│   │   ├── BaseController.ts     # Base class
│   │   ├── ReminderController.ts # Reminder methods
│   │   ├── DMController.ts       # Direct messaging
│   │   ├── SDMController.ts      # Secure DM with validation
│   │   ├── GiveAwayController.ts # Ecash giveaways
│   │   ├── SchedulePostController.ts
│   │   └── ErrorController.ts    # Test error handling
│   ├── services/
│   │   ├── nostr.ts             # Nostr relay management
│   │   ├── sendDM.ts            # NIP-17/NIP-04 DM sender
│   │   ├── ReminderService.ts   # Reminder logic
│   │   ├── SchedulerService.ts  # Generic job scheduler
│   │   ├── SchedulePostService.ts
│   │   ├── GiveAwayWalletService.ts # Cashu wallet
│   │   ├── proofStore.ts        # Ecash proof storage
│   │   └── claimStore.ts        # Giveaway claim tracking
│   ├── db/
│   │   └── reminder.ts          # SQLite reminder DB
│   └── scripts/
│       └── seedWallet.ts        # Seed ecash wallet
├── dist/                        # Compiled JavaScript
├── package.json
├── tsconfig.json
├── .env                         # Environment configuration
├── test-nrpc-client.html       # NRPC dashboard
├── claim-ecash.html            # Ecash claim tool
├── test-server-status.html     # Server status checker
├── reminders.db                # SQLite database
├── wallet.db                   # Ecash wallet database
└── README.md
```

## 🛠️ Development

### Adding a New Controller

1. **Create controller file** in `src/controllers/`:
```typescript
import { NRPCParams, MethodRegistry } from "../registry.js";
import { BaseController } from "./BaseController.js";
import { Event } from "nostr-tools";

export class MyController extends BaseController {
  constructor(registry: MethodRegistry) {
    super(registry);

    registry.register("myMethod", this.myMethod.bind(this), {
      params: [
        { name: "param1", type: "string", required: true }
      ],
      returns: [
        { name: "result", type: "string" }
      ],
      errors: [
        { code: 400, message: "Error description" }
      ]
    });
  }

  async myMethod(params: NRPCParams, event: Event) {
    // Your logic here
    return { result: "success" };
  }
}
```

2. **Register in** `src/app.ts`:
```typescript
import { MyController } from "./controllers/MyController.js";

// In main() function:
new MyController(Registry);
```

3. **Rebuild and restart**:
```bash
npm run build
npm start
```

### Database Schema

**Reminders** (`reminders.db`):
```sql
CREATE TABLE reminders (
  id TEXT PRIMARY KEY,
  time TEXT NOT NULL,
  date TEXT NOT NULL,
  text TEXT NOT NULL,
  owner TEXT NOT NULL,
  scheduled_at INTEGER NOT NULL
);
```

**Ecash Proofs** (`wallet.db`):
```sql
CREATE TABLE proofs (
  id TEXT,
  mint TEXT NOT NULL,
  secret TEXT NOT NULL,
  amount INTEGER NOT NULL,
  C TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  PRIMARY KEY (mint, secret, C)
);

CREATE TABLE claims (
  pubkey TEXT PRIMARY KEY,
  claimed_at INTEGER DEFAULT (strftime('%s','now'))
);
```

## 🔒 Security Notes

- Your NSEC is used to sign all server responses
- Keep your `.env` file secure and never commit it
- The ecash wallet database contains spendable tokens
- Gift-wrapped messages use ephemeral keys for privacy

## 📚 Dependencies

- **nostr-tools** (v2.16.2) - Nostr protocol utilities
- **@cashu/cashu-ts** - Ecash/Cashu integration
- **better-sqlite3** - SQLite database
- **ws** - WebSocket for relay connections
- **dotenv** - Environment configuration
- **uuid** - Unique ID generation

## 🤝 Contributing

Contributions welcome! This is a workshop/learning project.

## 📄 License

MIT

## 🔗 Resources

- [NIP-68/69 (NRPC)](https://github.com/nostr-protocol/nips/pull/1308)
- [Nostr Protocol](https://github.com/nostr-protocol/nostr)
- [Cashu Protocol](https://cashu.space)
- [NIP-17 (Private Direct Messages)](https://github.com/nostr-protocol/nips/blob/master/17.md)
