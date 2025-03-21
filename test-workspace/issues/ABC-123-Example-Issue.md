---
linear-issue-id: YOUR_LINEAR_ID_HERE
---

# ABC-123: Example Issue with Ticket ID

## Description

This is an example issue that demonstrates using the Linear ticket ID in the filename. The filename format used here is `${id}-${title}`.

## How to Use This Format

1. In your settings, set the filename format to include the ticket ID:

   ```json
   "linear-md.filenameFormat": "${id}-${title}.md"
   ```

2. When you sync down from Linear, the filename will automatically include the Linear ticket ID (e.g., ABC-123).

## Benefits

- Easy to identify which Linear ticket corresponds to each file
- Consistent naming convention across your workspace
- Makes it easier to reference tickets in discussions

## Notes

Remember that the `${ticket}` variable will only work with Linear issues, not documents, as documents don't have ticket identifiers.
