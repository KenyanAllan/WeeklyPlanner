import type { PlannerEvent, PositionedEvent } from '../types/schedule';

/**
 * Calculates side-by-side column positioning for events on the same day that overlap in time.
 */
export function computeEventPositions(events: PlannerEvent[]): PositionedEvent[] {
  if (events.length === 0) return [];

  // Sort events by start time, and then by longest duration first
  const sorted = [...events].sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) {
      return a.startMinutes - b.startMinutes;
    }
    return b.durationMinutes - a.durationMinutes;
  });

  // Split into independent clusters of overlapping events
  const clusters: PlannerEvent[][] = [];
  let currentCluster: PlannerEvent[] = [];
  let currentClusterEnd = -1;

  for (const event of sorted) {
    const eventEnd = event.startMinutes + event.durationMinutes;

    if (currentCluster.length === 0) {
      currentCluster.push(event);
      currentClusterEnd = eventEnd;
    } else if (event.startMinutes < currentClusterEnd) {
      // Overlaps with current cluster
      currentCluster.push(event);
      currentClusterEnd = Math.max(currentClusterEnd, eventEnd);
    } else {
      // No overlap: close current cluster and start new one
      clusters.push(currentCluster);
      currentCluster = [event];
      currentClusterEnd = eventEnd;
    }
  }

  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const result: PositionedEvent[] = [];

  // For each cluster, assign columns
  for (const cluster of clusters) {
    const columns: PlannerEvent[][] = [];
    const eventColumnMap = new Map<string, number>();

    for (const event of cluster) {
      let placed = false;

      // Try placing in an existing column where it doesn't overlap
      for (let c = 0; c < columns.length; c++) {
        const lastInCol = columns[c][columns[c].length - 1];
        const lastEnd = lastInCol.startMinutes + lastInCol.durationMinutes;

        if (event.startMinutes >= lastEnd) {
          columns[c].push(event);
          eventColumnMap.set(event.id, c);
          placed = true;
          break;
        }
      }

      // If cannot place in any existing column, create a new column
      if (!placed) {
        columns.push([event]);
        eventColumnMap.set(event.id, columns.length - 1);
      }
    }

    const totalColumns = columns.length;

    for (const event of cluster) {
      result.push({
        ...event,
        column: eventColumnMap.get(event.id) ?? 0,
        totalColumns,
      });
    }
  }

  return result;
}
