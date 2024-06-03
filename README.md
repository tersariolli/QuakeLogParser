# Quake 3 Arena Log Parser

## LogParser Class

### Overview

The LogParser class is designed to parse log files from Quake 3 Arena Server and extract meaningful events into structured data. It processes several types of events such as game initialization, player connections, disconnections, kills, and item pickups, and organizes them into match logs.

### Usage

```typescript
// when parsing a log file, an array of MatchLog is returned:
const parser = new LogParser('path/to/logfile.log');
const matches = await parser.parse();

matches.forEach(m => {
    console.log(`Match ID: ${m.id}`);
    console.log('Match details:');
    console.log(m);
});
```

### Interfaces

#### MatchLog

-   **id** (_number_): ID of the match.
-   **players**: (_Map<string, Player>_): Map of players present in the match.
-   **total_kills**: (_number_): Total kills in the match.
-   **kills_by_means**: (_Map<string, number>_): Kills by death cause.
-   **properties**: (_Dictionary<string>_): Properties of the match in key/value format.
-   **exitReason**: (_string_): Reason why the match ended.
-   **log**: (_EventLog[]_): Parsed logs of the match.

#### Player

-   **id**: (_string_): Unique identifier for the player.
-   **name**: (_string_): The player's in-game name.
-   **kills**: (_number_): The number of kills the player has achieved.
-   **deaths**: (_number_): The number of times the player has died.
-   **team**: (_string_): The team to which the player belongs.
-   **model**: (_string_): The character model used by the player.
-   **headModel**: (_string_): The head model used by the player.
-   **redTeam**: (_string_): The name of the red team, if applicable.
-   **blueTeam**: (_string_): The name of the blue team, if applicable.
-   **primaryColor**: (_string_): The primary color of the player's model.
-   **secondaryColor**: (_string_): The secondary color of the player's model.
-   **health**: (_string_): The player's health status.
-   **weapon**: (_string_): The weapon currently held by the player.
-   **latency**: (_string_): The player's network latency.
-   **totalTime**: (_string_): The total time the player has been in the game.
-   **totalLives**: (_string_): The total number of lives the player has had during the game.

#### EventLog

-   **time**: (_string_): The timestamp when the event occurred.
-   **event**: (_string_): The type of event (e.g., "InitGame", "Kill", "ShutdownGame").
-   **description**: (_string_): A textual description of the event.
-   **properties**: (_JsonObject_): Additional properties related to the event in key/value format.
