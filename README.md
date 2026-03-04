# @verticalint-michael/node-red-contrib-enrichlayer

Node-RED nodes for the [Enrich Layer](https://enrichlayer.com?utm_source=node-red&utm_medium=integration&utm_campaign=homepage) API. Enrich company, person, school, job, and contact profiles from Professional Networks.

## Installation

### Via Node-RED Palette Manager

1. Open **Menu > Manage Palette > Install**
2. Search for `@verticalint-michael/node-red-contrib-enrichlayer`
3. Click **Install**

### Via npm (in your `.node-red` directory)

```bash
cd ~/.node-red
npm install @verticalint-michael/node-red-contrib-enrichlayer
```

Then restart Node-RED.

## Setup

1. Drag any Enrich Layer node onto the canvas
2. Double-click to open the config dialog
3. Click the pencil icon next to **Config** to create a new configuration
4. Enter your **API Key** (get one at [enrichlayer.com](https://enrichlayer.com?utm_source=node-red&utm_medium=integration&utm_campaign=homepage))
5. Click **Done** to save

## Nodes

All nodes appear under the **Enrich Layer** category in the palette.

### Company (7 operations)

| Operation | API Path | Required Parameters | Credits |
|-----------|----------|-------------------|---------|
| Get Profile | `/api/v2/company` | `url` | 1 |
| Lookup | `/api/v2/company/resolve` | `company_name` or `company_domain` | 2 |
| ID Lookup | `/api/v2/company/resolve-id` | `id` | 0 |
| Picture | `/api/v2/company/profile-picture` | `company_profile_url` | 0 |
| List Employees | `/api/v2/company/employees/` | `url` | 3/employee |
| Employee Count | `/api/v2/company/employees/count` | `url` | 1 |
| Search Employees | `/api/v2/company/employee/search/` | `company_profile_url`, `keyword_boolean` | 10 |

### Person (4 operations)

| Operation | API Path | Required Parameters | Credits |
|-----------|----------|-------------------|---------|
| Get Profile | `/api/v2/profile` | `profile_url` | 1 |
| Lookup | `/api/v2/profile/resolve` | `first_name`, `company_domain` | 2 |
| Picture | `/api/v2/person/profile-picture` | `person_profile_url` | 0 |
| Role Lookup | `/api/v2/find/company/role/` | `company_name`, `role` | 3 |

### Contact (6 operations)

| Operation | API Path | Required Parameters | Credits |
|-----------|----------|-------------------|---------|
| Reverse Email | `/api/v2/profile/resolve/email` | `email` | 3 |
| Reverse Phone | `/api/v2/resolve/phone` | `phone_number` | 3 |
| Work Email | `/api/v2/profile/email` | `profile_url` | 3 |
| Personal Contact | `/api/v2/contact-api/personal-contact` | `profile_url` | 1/contact |
| Personal Email | `/api/v2/contact-api/personal-email` | `profile_url` | 1/email |
| Disposable Check | `/api/v2/disposable-email` | `email` | 0 |

### School (2 operations)

| Operation | API Path | Required Parameters | Credits |
|-----------|----------|-------------------|---------|
| Get Profile | `/api/v2/school` | `url` | 1 |
| List Students | `/api/v2/school/students/` | `school_url` | 3/student |

### Job (3 operations)

| Operation | API Path | Required Parameters | Credits |
|-----------|----------|-------------------|---------|
| Get Profile | `/api/v2/job` | `url` | 2 |
| Search Jobs | `/api/v2/company/job` | `search_id` | 2 |
| Job Count | `/api/v2/company/job/count` | `search_id` | 2 |

### Search (2 operations)

| Operation | API Path | Required Parameters | Credits |
|-----------|----------|-------------------|---------|
| Search Companies | `/api/v2/search/company` | *(all optional)* | 3/URL |
| Search People | `/api/v2/search/person` | `country` | 3/URL |

### Meta (1 operation)

| Operation | API Path | Required Parameters | Credits |
|-----------|----------|-------------------|---------|
| Credit Balance | `/api/v2/credit-balance` | *(none)* | 0 |

## Usage

Parameters can be set in two ways:

1. **Node config dialog** - Set static default values in the node properties
2. **`msg.payload`** - Pass parameters at runtime (overrides config values)

### Example: Get Company Profile

```json
[
    {
        "id": "inject1",
        "type": "inject",
        "payload": "{\"url\":\"https://www.example.com/company/google/\"}",
        "payloadType": "json",
        "wires": [["company1"]]
    },
    {
        "id": "company1",
        "type": "enrichlayer-company",
        "config": "config1",
        "operation": "getCompanyProfile",
        "wires": [["debug1"]]
    },
    {
        "id": "debug1",
        "type": "debug",
        "active": true
    },
    {
        "id": "config1",
        "type": "enrichlayer-config",
        "credentials": { "apiKey": "YOUR_API_KEY" }
    }
]
```

### Example: Check Credit Balance (smoke test)

Wire an **inject** node to a **meta** node (Credit Balance operation) to a **debug** node. Click inject to verify your API key works. This costs 0 credits.

## API Documentation

Full API documentation is available at [enrichlayer.com/docs](https://enrichlayer.com/docs?utm_source=node-red&utm_medium=integration&utm_campaign=docs).

## License

MIT
