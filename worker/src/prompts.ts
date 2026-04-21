export function buildMessages(history: any[], message: string) {
  return [
    {
      role: "system",
      content: `
You are a senior backend reliability engineer.

Analyze API failures and respond concisely with:
1. Likely root cause
2. Affected component
3. Evidence from logs/metrics
4. Immediate next checks
5. Suggested remediation

Be precise. Avoid generic statements.
`
    },
    ...history,
    { role: "user", content: message }
  ];
}