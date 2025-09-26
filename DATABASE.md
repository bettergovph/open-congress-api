# Neo4j Database Schema Documentation

This document describes the structure of the Neo4j graph database that stores Philippine Congress data.

## Overview

The database uses a graph model to represent the relationships between Congress sessions, committees, and people (senators and representatives). This structure allows for efficient querying of complex relationships like committee memberships across different congresses and tracking of political careers over time.

## Node Types

### 1. Congress Node

Represents a session of the Philippine Congress.

**Label:** `Congress`

**Properties:**
- `id` (string, required) - Unique identifier (ULID format)
- `congress_number` (integer, required) - Numeric identifier (e.g., 8, 14, 20)
- `congress_website_key` (integer) - Key used on official congress websites
- `name` (string) - Full name (e.g., "8th Congress of the Philippines")
- `ordinal` (string) - Ordinal representation (e.g., "8th", "14th", "20th")
- `start_date` (string) - ISO date when congress began (YYYY-MM-DD)
- `end_date` (string) - ISO date when congress ended (YYYY-MM-DD)
- `start_year` (integer) - Year congress began
- `end_year` (integer) - Year congress ended
- `year_range` (string) - Date range (e.g., "1987-1992")

**Example Cypher Query:**
```cypher
MATCH (c:Congress {congress_number: 20})
RETURN c
```

### 2. Committee Node

Represents a Senate committee within a Congress.

**Label:** `Committee`

**Properties:**
- `id` (string, required) - Unique identifier (ULID format)
- `name` (string, required) - Committee name
- `type` (string) - Committee type (e.g., "regular", "special")
- `senate_website_keys` (array of strings) - Keys used on Senate website

**Example Cypher Query:**
```cypher
MATCH (com:Committee)
WHERE com.name CONTAINS "Finance"
RETURN com
```

### 3. Person Node

Represents senators, representatives, and other congressional officials.

**Label:** `Person`

**Properties:**
- `id` (string, required) - Unique identifier (ULID format)
- `first_name` (string, 99.9% frequency) - Given name
- `last_name` (string, 99.9% frequency) - Surname
- `middle_name` (string, 92.2% frequency) - Middle name
- `name_prefix` (string, 0.3% frequency) - Name prefix (e.g., "Atty", "Dr")
- `name_suffix` (string, 15.8% frequency) - Name suffix (e.g., "Jr", "III")
- `professional_designations` (array of strings, 2.2% frequency) - Professional titles (e.g., ["RN"], ["MD"])
- `senate_website_keys` (array of strings, 5% frequency) - Keys used on Senate website for senators
- `congress_website_primary_keys` (array of integers, 96.6% frequency) - Primary keys used on Congress website
- `congress_website_author_keys` (array of strings, 96.6% frequency) - Author keys used on Congress website (e.g., ["G090"])
- `aliases` (array of strings, 39% frequency) - Alternative names or nicknames

**Example Cypher Query:**
```cypher
MATCH (p:Person)
WHERE p.last_name = "Aquino"
RETURN p
```

## Relationships

### 1. BELONGS_TO

Connects committees to the congresses they operated in.

**Direction:** `(Committee)-[:BELONGS_TO]->(Congress)`

**Properties:** None

**Example Cypher Query:**
```cypher
MATCH (com:Committee)-[:BELONGS_TO]->(con:Congress {congress_number: 20})
RETURN com.name, con.name
```

### 2. SERVED_IN

Connects people to the congresses they served in.

**Direction:** `(Person)-[:SERVED_IN]->(Congress)`

**Properties:**
- `position` (string) - Role in congress ("senator" or "representative")
- `type` (string) - Service type (typically "congress")

**Example Cypher Query:**
```cypher
MATCH (p:Person)-[r:SERVED_IN]->(c:Congress)
WHERE r.position = "senator"
RETURN p.last_name, p.first_name, c.ordinal
```

## Indexes

The following indexes are created for optimized query performance:

1. **Congress Indexes:**
   - `(Congress).id`
   - `(Congress).congress_number`

2. **Committee Indexes:**
   - `(Committee).id`
   - `(Committee).name`

3. **Person Indexes:**
   - `(Person).id`
   - `(Person).full_name`
   - `(Person).last_name`

## Common Query Patterns

### Find all senators in a specific congress
```cypher
MATCH (p:Person)-[r:SERVED_IN]->(c:Congress {congress_number: 20})
WHERE r.position = "senator"
RETURN p.last_name, p.first_name
ORDER BY p.last_name
```

### Find committees a person might be associated with in a congress
```cypher
MATCH (p:Person {last_name: "Angara"})-[:SERVED_IN]->(c:Congress)
MATCH (com:Committee)-[:BELONGS_TO]->(c)
RETURN DISTINCT com.name, c.ordinal
```

### Count representatives vs senators by congress
```cypher
MATCH (p:Person)-[r:SERVED_IN]->(c:Congress)
RETURN c.ordinal, r.position, COUNT(DISTINCT p) as count
ORDER BY c.congress_number, r.position
```

### Search for person by senate website key
```cypher
MATCH (p:Person)
WHERE "ABENI" IN p.senate_website_keys
RETURN p
```

### Find all congresses a person served in
```cypher
MATCH (p:Person {last_name: "Aquino", first_name: "Benigno"})-[r:SERVED_IN]->(c:Congress)
RETURN c.ordinal, r.position
ORDER BY c.congress_number
```

## Data Import Process

The database is populated by `scripts/sync_to_neo4j.py` which:

1. Reads TOML files from:
   - `data/congress/*.toml` - Congress entities
   - `data/committee/*.toml` - Committee entities
   - `data/person/*.toml` - Person entities

2. Creates nodes with MERGE operations (create if not exists, update if exists)

3. Establishes relationships based on:
   - `congresses` array in committee TOML files → BELONGS_TO relationships
   - `memberships` array in person TOML files → SERVED_IN relationships with position details

4. Creates indexes for optimized querying

## Connection Configuration

The sync script requires the following environment variables:

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
```

## REST API Usage

External REST APIs can query this database using the Neo4j driver for their respective language. The graph structure allows for:

- Efficient traversal of relationships
- Complex filtering across multiple entity types
- Aggregation queries for statistics
- Full-text search on indexed properties

## Notes for API Development

1. **Array Properties:** Properties like `senate_website_keys` and `aliases` are stored as arrays. Use the `IN` operator to search within them.

2. **Optional Properties:** Not all properties are present on all nodes. Always handle potential null values in your queries.

3. **Relationship Properties:** The `SERVED_IN` relationship includes properties that specify the role (senator/representative), allowing for role-specific queries.

4. **Performance:** Use indexed properties in WHERE clauses when possible for optimal query performance.

5. **Data Consistency:** The MERGE operations ensure no duplicate nodes are created based on the `id` property.