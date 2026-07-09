import { useState } from "react";
import NavBar from "../components/NavBar";
import { doshaQuestions } from "../data/doshaQuestions";
import wellnessPlans from "../data/dosha_wellness_plans.json";

const DOSHAS = ["Vata", "Pitta", "Kapha"];

export default function DoshaAssessment() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0); // question index
  const [answers, setAnswers] = useState([]); // array of dosha strings, one per answered question
  const [result, setResult] = useState(null);

  const totalQuestions = doshaQuestions.length;
  const currentQuestion = doshaQuestions[step];
  const progressPercent = Math.round((step / totalQuestions) * 100);

  function handleAnswer(doshaTag) {
    const updatedAnswers = [...answers, doshaTag];
    setAnswers(updatedAnswers);

    if (step + 1 < totalQuestions) {
      setStep(step + 1);
    } else {
      setResult(calculateResult(updatedAnswers));
    }
  }

  function handleBack() {
    if (step > 0) {
      setAnswers(answers.slice(0, -1));
      setStep(step - 1);
    }
  }

  function calculateResult(allAnswers) {
    const counts = { Vata: 0, Pitta: 0, Kapha: 0 };
    allAnswers.forEach((d) => {
      counts[d] += 1;
    });

    const total = allAnswers.length;
    const percentages = DOSHAS.map((d) => ({
      dosha: d,
      percent: Math.round((counts[d] / total) * 100),
    })).sort((a, b) => b.percent - a.percent);

    const [first, second] = percentages;
    const isDualDosha = first.percent - second.percent <= 15;
    const isTridoshic =
      percentages[0].percent - percentages[2].percent <= 10;

    return {
      percentages,
      primary: first.dosha,
      secondary: isDualDosha ? second.dosha : null,
      isTridoshic,
    };
  }

  function restart() {
    setStep(0);
    setAnswers([]);
    setResult(null);
  }

  // --- Intro screen ---
  if (!started) {
    return (
      <div style={styles.container}>
        <NavBar />
        <h1 style={styles.heading}>Discover Your Dosha</h1>
        <p style={styles.subtext}>
          Answer 20 quick questions about your body, mind, and lifestyle to
          uncover your unique Ayurvedic constitution (Prakriti), and get a
          wellness plan tailored to you.
        </p>
        <button style={styles.primaryButton} onClick={() => setStarted(true)}>
          Start Assessment
        </button>
      </div>
    );
  }

  // --- Results screen ---
  if (result) {
    const planKey = result.isTridoshic ? null : result.primary;
    const plan = planKey ? wellnessPlans[planKey] : null;

    return (
      <div style={styles.container}>
        <NavBar />
        <h1 style={styles.heading}>Your Constitution</h1>

        {result.isTridoshic ? (
          <p style={styles.resultHeadline}>You are Tridoshic — a balanced mix of all three doshas.</p>
        ) : (
          <p style={styles.resultHeadline}>
            You are primarily <strong>{result.primary}</strong>
            {result.secondary ? ` with a secondary ${result.secondary} influence` : ""}.
          </p>
        )}

        <div style={styles.barChart}>
          {result.percentages.map(({ dosha, percent }) => (
            <div key={dosha} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{dosha}</span>
                <span>{percent}%</span>
              </div>
              <div style={styles.barTrack}>
                <div style={{ ...styles.barFill, width: `${percent}%` }} />
              </div>
            </div>
          ))}
        </div>

        {plan && (
          <div style={styles.planSection}>
            <h2 style={styles.subheading}>Your Personalized Wellness Plan</h2>
            <p>{plan.summary}</p>

            <h3 style={styles.smallHeading}>Diet — Favor</h3>
            <ul>{plan.diet.favor.map((item) => <li key={item}>{item}</li>)}</ul>

            <h3 style={styles.smallHeading}>Diet — Reduce</h3>
            <ul>{plan.diet.reduce.map((item) => <li key={item}>{item}</li>)}</ul>

            <h3 style={styles.smallHeading}>Daily Routine</h3>
            <p>Wake: {plan.daily_routine.wake_time} &middot; Sleep: {plan.daily_routine.sleep_time}</p>
            <p>{plan.daily_routine.notes}</p>

            <h3 style={styles.smallHeading}>Recommended Exercise</h3>
            <p>{plan.exercise.type}: {plan.exercise.examples.join(", ")}</p>
            <p>{plan.exercise.notes}</p>

            <h3 style={styles.smallHeading}>Seasonal Note</h3>
            <p>{plan.seasonal_note}</p>
          </div>
        )}

        {result.isTridoshic && (
          <p style={styles.subtext}>
            Since your constitution is balanced across all three doshas, focus
            on maintaining overall routine consistency and observe which
            imbalances arise seasonally rather than following a single
            dosha-specific plan.
          </p>
        )}

        <button style={styles.secondaryButton} onClick={restart}>
          Retake Assessment
        </button>
      </div>
    );
  }

  // --- Question screen ---
  return (
    <div style={styles.container}>
      <NavBar />
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
      </div>
      <p style={styles.questionCount}>
        Question {step + 1} of {totalQuestions}
      </p>
      <h2 style={styles.heading}>{currentQuestion.question}</h2>

      <div style={styles.optionsList}>
        {currentQuestion.options.map((option) => (
          <button
            key={option.text}
            style={styles.optionButton}
            onClick={() => handleAnswer(option.dosha)}
          >
            {option.text}
          </button>
        ))}
      </div>

      {step > 0 && (
        <button style={styles.backButton} onClick={handleBack}>
          Back
        </button>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: "60px auto",
    padding: "0 24px",
    fontFamily: "Georgia, serif",
  },
  heading: { fontSize: 28, marginBottom: 12 },
  subheading: { fontSize: 22, marginTop: 24, marginBottom: 8 },
  smallHeading: { fontSize: 16, marginTop: 16, marginBottom: 4 },
  subtext: { fontSize: 15, color: "#555", marginBottom: 24, lineHeight: 1.5 },
  questionCount: { fontSize: 13, color: "#888", marginBottom: 8 },
  resultHeadline: { fontSize: 18, marginBottom: 24 },
  primaryButton: {
    padding: "14px 28px",
    backgroundColor: "#2d5a3d",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    fontSize: 16,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "12px 24px",
    backgroundColor: "transparent",
    color: "#2d5a3d",
    border: "1px solid #2d5a3d",
    borderRadius: 999,
    fontSize: 15,
    cursor: "pointer",
    marginTop: 24,
  },
  backButton: {
    marginTop: 16,
    background: "none",
    border: "none",
    color: "#888",
    cursor: "pointer",
    fontSize: 14,
    textDecoration: "underline",
  },
  optionsList: { display: "flex", flexDirection: "column", gap: 12, marginTop: 20 },
  optionButton: {
    padding: "16px 20px",
    textAlign: "left",
    border: "1px solid #ddd",
    borderRadius: 12,
    backgroundColor: "#fafafa",
    fontSize: 15,
    cursor: "pointer",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2d5a3d",
    transition: "width 0.3s ease",
  },
  barChart: { marginTop: 20, marginBottom: 20 },
  barTrack: {
    height: 10,
    backgroundColor: "#eee",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 4,
  },
  barFill: {
    height: "100%",
    backgroundColor: "#2d5a3d",
  },
  planSection: {
    marginTop: 24,
    padding: 20,
    backgroundColor: "#f6f4ee",
    borderRadius: 16,
  },
};
