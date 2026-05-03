import type { GraphEdge } from "@understand-anything/core/types";

/** Returns [nodeId, communityId] for every node provided. */
export function detectCommunities(
  _nodeIds: string[],
  _edges: GraphEdge[],
): Map<string, number> {
  // Real implementation arrives in Task 3. Stub: every node in community 0.
  const m = new Map<string, number>();
  for (const id of _nodeIds) m.set(id, 0);
  return m;
}
