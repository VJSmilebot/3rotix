// utils/onboardingRules.js
export function evaluateRule({ rule, userRecord, signalsByKey }) {
  if (!rule) return false;

  // Logical composites
  if (rule.all && Array.isArray(rule.all)) {
    return rule.all.every((r) => evaluateRule({ rule: r, userRecord, signalsByKey }));
  }
  if (rule.any && Array.isArray(rule.any)) {
    return rule.any.some((r) => evaluateRule({ rule: r, userRecord, signalsByKey }));
  }

  // Signal check
  if (rule.signalKey) {
    const sig = signalsByKey[rule.signalKey];
    const expected = "equals" in rule ? rule.equals : true;
    return Boolean(sig?.isTrue) === Boolean(expected);
  }

  // User field existence check
  if (rule.userField) {
    const val = userRecord?.[rule.userField];
    if (rule.exists === true) return val !== null && val !== undefined && String(val).trim() !== "";
    if (rule.exists === false) return val === null || val === undefined || String(val).trim() === "";
  }

  // Fallback
  return false;
}

export function isJurisdictionMatch({ step, country, state }) {
  const j = step?.jurisdictions;
  if (!j) return true; // if no targeting, applies to everyone

  const countries = Array.isArray(j.countries) ? j.countries : [];
  const states = Array.isArray(j.states) ? j.states : [];

  if (countries.length && country && !countries.includes(country)) return false;
  if (states.length && state && !states.includes(state)) return false;

  return true;
}
