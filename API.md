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
- `include_stats` (string): Include member counts and bill statistics (set to "true")
- `limit` (integer): Items per page
- `offset` (integer): Items to skip

Example:
```bash
curl "http://localhost:5173/api/congresses?year=2020&limit=10"

# With statistics
curl "http://localhost:5173/api/congresses?include_stats=true&limit=10"
```

When `include_stats=true` is provided, each congress object will include:
- `total_senators`: Number of senators in this congress
- `total_representatives`: Number of representatives in this congress
- `total_committees`: Number of committees in this congress
- `total_bills`: Total number of bills filed
- `total_house_bills`: Number of House Bills filed
- `total_senate_bills`: Number of Senate Bills filed

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

Query Parameters:
- `include_congresses` (string): Include congress memberships (set to "true")

Example:
```bash
curl "http://localhost:5173/api/people/01H8ZXR5KBQZ..."

# With congress memberships
curl "http://localhost:5173/api/people/01H8ZXR5KBQZ...?include_congresses=true"
```

When `include_congresses=true` is provided, the person object will include a `congresses` array with membership details (congress number, ordinal, group name, and position).

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

### Bill/Document Endpoints

#### List All Bills
```http
GET /api/bills
```

Query Parameters:
- `congress` (integer): Filter by congress number
- `type` (string): Filter by type ("hb" for House Bills, "sb" for Senate Bills)
- `author` (string): Filter by author's last name
- `search` (string): Search in bill title
- `date_from` (string): Filter by date filed (ISO date)
- `date_to` (string): Filter by date filed (ISO date)
- `limit` (integer): Items per page
- `offset` (integer): Items to skip

Example:
```bash
curl "http://localhost:5173/api/bills?congress=19&type=sb"
```

#### Get Bill by ID or Number
```http
GET /api/bills/:id
```

Parameters:
- `id`: Bill ULID or bill number (e.g., "HB00001", "SB00001")

Example:
```bash
curl "http://localhost:5173/api/bills/HB00001"
```

#### Get Bill Authors
```http
GET /api/bills/:id/authors
```

Returns all authors of a specific bill.

Example:
```bash
curl "http://localhost:5173/api/bills/SB00001/authors"
```

#### Get Person's Authored Bills
```http
GET /api/people/:id/bills
```

Query Parameters:
- `congress` (integer): Filter by congress number
- `type` (string): Filter by bill type ("hb" or "sb")
- `limit` (integer): Items per page
- `offset` (integer): Items to skip

Returns all bills authored by a specific person.

Example:
```bash
curl "http://localhost:5173/api/people/01H8ZXR5KBQZ.../bills?congress=19"
```

#### Get Congress Bills
```http
GET /api/congresses/:id/bills
```

Query Parameters:
- `type` (string): Filter by type ("hb", "sb", or "all")
- `author` (string): Filter by author's last name
- `limit` (integer): Items per page
- `offset` (integer): Items to skip

Returns all bills filed in a specific congress.

Example:
```bash
curl "http://localhost:5173/api/congresses/19/bills?type=hb"
```

### Statistics Endpoint

#### Overall Statistics
```http
GET /api/stats
```

Returns comprehensive statistics about the database including:
- Total counts for bills, people, congresses, and committees
- Breakdown of bills by type (House vs Senate)
- Bills by congress
- Bills with and without filing dates

Example response:
```json
{
  "success": true,
  "data": {
    "total_bills": 54321,
    "total_house_bills": 32109,
    "total_senate_bills": 22212,
    "total_congresses": 20,
    "total_people": 2134,
    "total_committees": 450,
    "bills_with_dates": 1234,
    "bills_without_dates": 53087,
    "bills_by_congress": [
      {
        "congress": 20,
        "total": 3456,
        "house_bills": 2100,
        "senate_bills": 1356
      }
    ]
  }
}
```

### Search & Statistics Endpoints (To Be Implemented)

#### Global Search
```http
GET /api/search
```

Query Parameters:
- `q` (string): Search query
- `type` (string): Entity type ("congress", "person", "committee", "bill", or "all")
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

Returns detailed statistics for a specific congress, including bill counts.

## Database Architecture

The API uses a Neo4j graph database with the following structure:
- **Congress** nodes represent congressional sessions
- **Group** nodes represent chambers (Senate/House) for each congress
- **Person** nodes represent senators and representatives
- **Committee** nodes represent congressional committees
- **Document** nodes represent legislative bills (House Bills and Senate Bills)

Key relationships:
- Person → MEMBER_OF → Group → BELONGS_TO → Congress
- Committee → BELONGS_TO → Congress
- Person → AUTHORED → Document → FILED_IN → Congress

This structure allows tracking of:
- People's service across multiple congresses and chambers
- Bill authorship and co-authorship
- Committee memberships
- Legislative activity by congress

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
  // Extended with stats when fetching single congress or when include_stats=true
  total_senators?: number;
  total_representatives?: number;
  total_committees?: number;
  total_bills?: number;
  total_house_bills?: number;
  total_senate_bills?: number;
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

### Bill/Document
```typescript
{
  id: string;
  type: "document";
  subtype: "hb" | "sb";
  bill_number: string;
  congress: number;
  title: string;
  long_title?: string;
  date_filed?: string;
  scope?: string;
  subjects?: string[];
  authors_raw?: string;
  senate_website_permalink?: string;
  download_url_sources?: string[];
  // Extended when fetching single bill
  authors?: Person[];
  congress_details?: Congress;
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

### Get Senate Bills from 19th Congress
```bash
curl "http://localhost:5173/api/bills?congress=19&type=sb&limit=10"
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "01H8ZXR5KB...",
      "bill_number": "SB00001",
      "title": "Better Healthcare Act",
      "date_filed": "2019-07-01",
      "congress": 19,
      "subtype": "sb"
    }
  ],
  "pagination": {
    "total": 2500,
    "limit": 10,
    "offset": 0,
    "has_more": true,
    "next_cursor": "10"
  }
}
```

### Get Authors of a Bill
```bash
curl "http://localhost:5173/api/bills/SB00001/authors"
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "01H8ZXR5KBQZ...",
      "first_name": "Juan",
      "last_name": "Dela Cruz",
      "full_name": "Juan Dela Cruz"
    },
    {
      "id": "01H8ZXR5KBQY...",
      "first_name": "Maria",
      "last_name": "Santos",
      "full_name": "Maria Santos"
    }
  ]
}
```

### Get Bills Authored by a Person
```bash
curl "http://localhost:5173/api/people/01H8ZXR5KBQZ.../bills?congress=19"
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "01H8ZXR5KB...",
      "bill_number": "SB00001",
      "title": "Better Healthcare Act",
      "date_filed": "2019-07-01",
      "congress": 19,
      "subtype": "sb"
    },
    {
      "id": "01H8ZXR5KC...",
      "bill_number": "SB00015",
      "title": "Education Reform Act",
      "date_filed": "2019-07-15",
      "congress": 19,
      "subtype": "sb"
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