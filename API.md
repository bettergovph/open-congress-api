# Philippine Congress API Documentation

## Base URL
```
http://localhost:5173/api
```

## Response Format
All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "pagination": { /* pagination info if applicable */ }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## Pagination
For endpoints that return lists, pagination is supported:

- `limit`: Number of items per page (default: 20, max: 100)
- `offset`: Number of items to skip
- `cursor`: Next page cursor (when available)

Pagination response format:
```json
{
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "has_more": true,
    "next_cursor": "20"
  }
}
```

## API Endpoints

### Congress Endpoints

#### List All Congresses
```http
GET /api/congresses
```

Query Parameters:
- `year` (integer): Filter by year
- `ordinal` (string): Filter by ordinal (e.g., "20th")
- `limit` (integer): Items per page
- `offset` (integer): Items to skip

Example:
```bash
curl "http://localhost:5173/api/congresses?year=2020&limit=10"
```

#### Get Congress by ID or Number
```http
GET /api/congresses/:id
```

Parameters:
- `id`: Congress ULID or congress number

Examples:
```bash
# Get by congress number
curl "http://localhost:5173/api/congresses/20"

# Get by ULID
curl "http://localhost:5173/api/congresses/01H8ZXR5KBQZ..."
```

#### Get Congress Senators
```http
GET /api/congresses/:id/senators
```

Query Parameters:
- `limit` (integer): Items per page
- `offset` (integer): Items to skip

Example:
```bash
curl "http://localhost:5173/api/congresses/20/senators"
```

#### Get Congress Representatives
```http
GET /api/congresses/:id/representatives
```

Query Parameters:
- `limit` (integer): Items per page
- `offset` (integer): Items to skip

Example:
```bash
curl "http://localhost:5173/api/congresses/20/representatives"
```

#### Get Congress Committees
```http
GET /api/congresses/:id/committees
```

Query Parameters:
- `type` (string): Filter by committee type
- `limit` (integer): Items per page
- `offset` (integer): Items to skip

Example:
```bash
curl "http://localhost:5173/api/congresses/20/committees?type=regular"
```

### People Endpoints

#### List All People
```http
GET /api/people
```

Query Parameters:
- `type` (string): Filter by type ("senator" or "representative")
- `congress` (integer): Filter by congress number
- `last_name` (string): Filter by last name
- `search` (string): Search by name or alias
- `limit` (integer): Items per page
- `offset` (integer): Items to skip

Example:
```bash
curl "http://localhost:5173/api/people?type=senator&congress=20"
```

#### Get Person by ID
```http
GET /api/people/:id
```

Parameters:
- `id`: Person ULID

Example:
```bash
curl "http://localhost:5173/api/people/01H8ZXR5KBQZ..."
```

#### Get Person's Congress History
```http
GET /api/people/:id/congresses
```

Returns all congresses where the person served.

Example:
```bash
curl "http://localhost:5173/api/people/01H8ZXR5KBQZ.../congresses"
```


### Committee Endpoints (To Be Implemented)

#### List All Committees
```http
GET /api/committees
```

Query Parameters:
- `type` (string): Filter by committee type
- `congress_number` (integer): Filter by congress number
- `name` (string): Search by committee name
- `limit` (integer): Items per page
- `offset` (integer): Items to skip

#### Get Committee by ID
```http
GET /api/committees/:id
```

#### Get Committee Members
```http
GET /api/committees/:id/members
```

### Search & Statistics Endpoints (To Be Implemented)

#### Global Search
```http
GET /api/search
```

Query Parameters:
- `q` (string): Search query
- `type` (string): Entity type ("congress", "person", "committee", or "all")
- `limit` (integer): Items per page
- `offset` (integer): Items to skip

#### Overall Statistics
```http
GET /api/stats/overview
```

Returns general statistics about the database.

#### Congress Statistics
```http
GET /api/stats/congress/:id
```

Returns detailed statistics for a specific congress.

## Database Architecture

The API uses a Neo4j graph database with the following structure:
- **Person** nodes represent senators and representatives
- **Group** nodes represent chambers (Senate/House) for each congress
- **Congress** nodes represent congressional sessions
- Relationships: Person → MEMBER_OF → Group → BELONGS_TO → Congress

This structure allows tracking of people's service across multiple congresses and chambers.

## Data Models

### Congress
```typescript
{
  id: string;
  congress_number: number;
  congress_website_key?: number;
  name: string;
  ordinal: string;
  start_date?: string;
  end_date?: string;
  start_year?: number;
  end_year?: number;
  year_range?: string;
  // Extended with stats when fetching single congress
  total_senators?: number;
  total_representatives?: number;
  total_committees?: number;
}
```

### Person
```typescript
{
  id: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  name_prefix?: string;
  name_suffix?: string;
  full_name: string;
  professional_designations?: string[];
  senate_website_keys?: string[];
  congress_website_primary_keys?: number[];
  congress_website_author_keys?: string[];
  aliases?: string[];
  // Extended when fetching single person
  congresses?: CongressMembership[];
}
```

### CongressMembership
```typescript
{
  congress_id: string;
  congress_number: number;
  congress_ordinal: string;
  position: "senator" | "representative";
  chamber?: "senate" | "house";
  start_date?: string;
  end_date?: string;
  year_range?: string;
}
```

### Committee
```typescript
{
  id: string;
  name: string;
  type?: string;
  senate_website_keys?: string[];
  // Extended when fetching single committee
  congress_id?: string;
  congress_number?: number;
  congress_ordinal?: string;
}
```

## Error Codes

- `DB_NOT_INITIALIZED`: Database connection not available
- `NOT_FOUND`: Requested resource not found
- `FETCH_ERROR`: Error fetching data from database
- `VALIDATION_ERROR`: Invalid request parameters
- `INTERNAL_ERROR`: Internal server error

## Rate Limiting

Currently, no rate limiting is implemented. This will be added in future versions.

## Authentication

Currently, all endpoints are public. Authentication will be added for write operations in future versions.

## Examples

### Get the 20th Congress with Statistics
```bash
curl "http://localhost:5173/api/congresses/20"
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "01H8ZXR5KBQZ...",
    "congress_number": 20,
    "name": "20th Congress of the Philippines",
    "ordinal": "20th",
    "start_date": "2022-06-30",
    "end_date": "2025-06-30",
    "start_year": 2022,
    "end_year": 2025,
    "year_range": "2022-2025",
    "total_senators": 24,
    "total_representatives": 316,
    "total_committees": 39
  }
}
```

### Search for People Named "Aquino"
```bash
curl "http://localhost:5173/api/people?search=Aquino"
```

### Get All Senators from the 20th Congress
```bash
curl "http://localhost:5173/api/congresses/20/senators"
```

### Get a Person's Service History
```bash
curl "http://localhost:5173/api/people/01H8ZXR5KBQZ.../congresses"
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "congress_id": "01H8ZXR5KBQZ...",
      "congress_number": 20,
      "congress_ordinal": "20th",
      "position": "senator",
      "chamber": "senate",
      "start_date": "2022-06-30",
      "end_date": "2025-06-30",
      "year_range": "2022-2025"
    },
    {
      "congress_id": "01H8ZXR5KBQY...",
      "congress_number": 19,
      "congress_ordinal": "19th",
      "position": "senator",
      "chamber": "senate",
      "start_date": "2019-06-30",
      "end_date": "2022-06-30",
      "year_range": "2019-2022"
    }
  ]
}
```

## Future Enhancements

- Bill tracking endpoints
- Voting records
- Committee membership details
- Political party affiliations
- Advanced search with filters
- GraphQL endpoint
- WebSocket for real-time updates
- Authentication and authorization
- Rate limiting
- Caching layer
- Data export endpoints (CSV, JSON)