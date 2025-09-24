// Call Log Constants and Types

export const CALL_OUTCOMES = {
  WILL_CALL_BACK: "will_call_back",
  SCHEDULED: "scheduled",
  NOT_INTERESTED: "not_interested",
  PAYMENT_PROMISED: "payment_promised",
  NO_ANSWER: "no_answer",
  VOICEMAIL_LEFT: "voicemail_left",
  WRONG_NUMBER: "wrong_number",
  REQUESTED_CALLBACK: "requested_callback",
  NEEDS_MORE_TIME: "needs_more_time",
  WILL_PAY_TODAY: "will_pay_today",
  DISPUTE_RAISED: "dispute_raised",
  RESCHEDULED: "rescheduled",
  CANCELLED: "cancelled"
} as const;

export const CALL_OUTCOME_LABELS = {
  [CALL_OUTCOMES.WILL_CALL_BACK]: "Will call back",
  [CALL_OUTCOMES.SCHEDULED]: "Scheduled",
  [CALL_OUTCOMES.NOT_INTERESTED]: "Not interested",
  [CALL_OUTCOMES.PAYMENT_PROMISED]: "Payment promised",
  [CALL_OUTCOMES.NO_ANSWER]: "No answer",
  [CALL_OUTCOMES.VOICEMAIL_LEFT]: "Voicemail left",
  [CALL_OUTCOMES.WRONG_NUMBER]: "Wrong number",
  [CALL_OUTCOMES.REQUESTED_CALLBACK]: "Requested callback",
  [CALL_OUTCOMES.NEEDS_MORE_TIME]: "Needs more time",
  [CALL_OUTCOMES.WILL_PAY_TODAY]: "Will pay today",
  [CALL_OUTCOMES.DISPUTE_RAISED]: "Dispute raised",
  [CALL_OUTCOMES.RESCHEDULED]: "Rescheduled",
  [CALL_OUTCOMES.CANCELLED]: "Cancelled"
} as const;

export type CallOutcome = typeof CALL_OUTCOMES[keyof typeof CALL_OUTCOMES];


// Quick outcome buttons for common scenarios
export const QUICK_OUTCOMES = {
  SCHEDULING: [
    { outcome: CALL_OUTCOMES.SCHEDULED, label: "Scheduled", followUpDays: 0 },
    { outcome: CALL_OUTCOMES.WILL_CALL_BACK, label: "Will call back Monday", followUpDays: 3 },
    { outcome: CALL_OUTCOMES.RESCHEDULED, label: "Rescheduled", followUpDays: 1 },
    { outcome: CALL_OUTCOMES.NOT_INTERESTED, label: "Not interested", followUpDays: null },
  ],
  PAYMENT: [
    { outcome: CALL_OUTCOMES.WILL_PAY_TODAY, label: "Will pay today", followUpDays: 1 },
    { outcome: CALL_OUTCOMES.PAYMENT_PROMISED, label: "Payment promised Friday", followUpDays: 5 },
    { outcome: CALL_OUTCOMES.NEEDS_MORE_TIME, label: "Needs more time", followUpDays: 7 },
    { outcome: CALL_OUTCOMES.DISPUTE_RAISED, label: "Dispute raised", followUpDays: null },
  ],
  COMMON: [
    { outcome: CALL_OUTCOMES.NO_ANSWER, label: "No answer", followUpDays: 1 },
    { outcome: CALL_OUTCOMES.VOICEMAIL_LEFT, label: "Left voicemail", followUpDays: 2 },
    { outcome: CALL_OUTCOMES.REQUESTED_CALLBACK, label: "They'll call us back", followUpDays: 3 },
    { outcome: CALL_OUTCOMES.WRONG_NUMBER, label: "Wrong number", followUpDays: null },
  ]
} as const;