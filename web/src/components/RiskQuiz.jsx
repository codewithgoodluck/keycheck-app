import { useState } from 'react'
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react'
import { RISK_QUIZ_QUESTIONS, scoreRisk, RISK_BAND_COPY } from '../data/riskQuizQuestions.js'

const BAND_ICON = { low: ShieldCheck, medium: AlertTriangle, high: ShieldAlert }

export default function RiskQuiz() {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const allAnswered = RISK_QUIZ_QUESTIONS.every((q) => q.id in answers)

  function answer(id, value) {
    setAnswers((a) => ({ ...a, [id]: value }))
  }

  function reset() {
    setAnswers({})
    setSubmitted(false)
  }

  if (submitted) {
    const { band, yesCount } = scoreRisk(answers)
    const { label, message } = RISK_BAND_COPY[band]
    const Icon = BAND_ICON[band]
    return (
      <div className={`form-card quiz-result quiz-result-${band}`}>
        <Icon size={28} />
        <h3>{label}</h3>
        <p>
          {yesCount} of {RISK_QUIZ_QUESTIONS.length} red flags present.
        </p>
        <p>{message}</p>
        <p className="disclaimer">
          This isn't legal advice — it's a pattern check based on real reported cases. If in
          doubt, verify independently (LASRERA, the Land Registry, or a lawyer) before you pay.
        </p>
        <button onClick={reset}>Take it again</button>
      </div>
    )
  }

  return (
    <div className="form-card">
      <div className="quiz-questions">
        {RISK_QUIZ_QUESTIONS.map((q) => (
          <div key={q.id} className="quiz-question">
            <p>{q.text}</p>
            <div className="quiz-answers">
              <button className={answers[q.id] === true ? 'active' : ''} onClick={() => answer(q.id, true)}>
                Yes
              </button>
              <button className={answers[q.id] === false ? 'active' : ''} onClick={() => answer(q.id, false)}>
                No
              </button>
            </div>
          </div>
        ))}
      </div>
      <button className="submit-btn" disabled={!allAnswered} onClick={() => setSubmitted(true)}>
        See my result
      </button>
    </div>
  )
}
