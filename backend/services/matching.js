/**
 * Member 2 (`feat/claim-engine`) Placeholder:
 * Will evaluate shelter cutoff_time, max_portions capacity, has_van tray compatibility,
 * and 3-minute priority visibility holds for low-reliability shelters.
 */
function evaluateShelterEligibility(batch, shelterProfile, now = new Date()) {
  // TODO (Member 2): Implement full constraint matching engine.
  return {
    can_claim: Boolean(batch && shelterProfile && now),
    status: 'ELIGIBLE',
    reasons: [],
    priority_hold_seconds: 0,
    available_at: batch ? batch.created_at : null,
  };
}

module.exports = {
  evaluateShelterEligibility,
};
