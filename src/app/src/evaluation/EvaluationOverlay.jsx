/*
========================================
EVALUATION OVERLAY
========================================
* Full-screen research-instrument quiz overlay (dissertation evaluation, not
* a learner-facing assessment) — pre/post administration of the same
* question bank, with no score shown until the whole session is downloaded
* as JSON. See docs/design/APP_IMPLEMENTATION_NOTES.md for the full rationale.
* `study` (1 or 2) selects which instrument/question bank/storage key this
* instance runs — App.jsx mounts one instance per study.
*/

import { useState } from "react";
import { STUDY1_QUESTIONS, STUDY2_QUESTIONS } from "./quizContent.js";
import {
   recordQuizPass,
   getAllRecords,
   clearAllRecords,
   hasStoredPhase,
   STUDY1_STORAGE_KEY,
   STUDY2_STORAGE_KEY,
} from "./evaluationStorage.js";
import QuizPatternImage from "./QuizPatternImage.jsx";
import "./EvaluationOverlay.css";

const STUDY_CONFIG = {
   1: {
      questions: STUDY1_QUESTIONS,
      storageKey: STUDY1_STORAGE_KEY,
      label: "Study 1",
      filenamePrefix: "evaluation-results",
      intro:
         "This is an optional research instrument for the dissertation this " +
         "application supports. It measures whether exploring the algorithm " +
         "workflows below actually helps understanding of computational " +
         "thinking concepts.",
   },
   2: {
      questions: STUDY2_QUESTIONS,
      storageKey: STUDY2_STORAGE_KEY,
      label: "Study 2",
      filenamePrefix: "study2-evaluation-results",
      // The "Responses are stored..." line further down is deliberately not
      // repeated here — it's already rendered once, identically, for every
      // study by the shared paragraph right below {config.intro} in JSX.
      intro:
         "This is a separate quiz from Study 1's, testing compositional " +
         "reasoning, using image-based questions alongside text ones.",
   },
};

// One dot per phase — pre and post are tracked (and shown) separately, since
// a participant can easily have taken one but not the other. Green = that
// phase has at least one stored pass; empty/hollow = none yet. Shown on both
// the intro screen (before taking either quiz, and again immediately after
// Clear Stored Responses) and the post-submit summary screen (right after a
// pass is recorded), so "is my pre/post result stored?" never requires
// downloading the file to find out.
function StorageStatus({ hasPre, hasPost }) {
   return (
      <ul className="eval-storage-status" role="status">
         <li>
            <span
               className={`eval-storage-dot${hasPre ? " eval-storage-dot-stored" : " eval-storage-dot-empty"}`}
               aria-hidden="true"
            />
            {hasPre ? "Pre-quiz stored" : "Pre-quiz not stored"}
         </li>
         <li>
            <span
               className={`eval-storage-dot${hasPost ? " eval-storage-dot-stored" : " eval-storage-dot-empty"}`}
               aria-hidden="true"
            />
            {hasPost ? "Post-quiz stored" : "Post-quiz not stored"}
         </li>
      </ul>
   );
}

function download(text, filename) {
   const blob = new Blob([text], { type: "application/json" });
   const url = URL.createObjectURL(blob);
   const a = document.createElement("a");
   a.href = url;
   a.download = filename;
   a.click();
   URL.revokeObjectURL(url);
}

// A question is "answered" once it has a selection at all — for
// "node-select" that means at least one node checked (not just a key
// existing), and "order" requires every node to have a chosen position.
function isAnswered(question, answers) {
   const value = answers[question.id];
   if (question.type === "node-select") return Array.isArray(value) && value.length > 0;
   if (question.type === "order") {
      return !!value && question.nodeSequence.every((node) => value[node] !== undefined && value[node] !== "");
   }
   return value !== undefined;
}

function toggleNode(selected, node) {
   const current = selected ?? [];
   return current.includes(node) ? current.filter((n) => n !== node) : [...current, node];
}

function setOrderPosition(selected, node, position) {
   return { ...(selected ?? {}), [node]: position };
}

function QuestionBody({ question, selected, onSelectIndex, onToggleNode, onSetOrder }) {
   switch (question.type) {
      case "cause":
         return (
            <>
               <div className="eval-image-row">
                  <QuizPatternImage entryId={question.entryId} overrides={question.paramsBefore} label="Image 1" />
                  <QuizPatternImage entryId={question.entryId} overrides={question.paramsAfter} label="Image 2" />
               </div>
               {question.options.map((opt, oi) => (
                  <label key={oi} className="eval-option">
                     <input type="radio" name={question.id} checked={selected === oi} onChange={() => onSelectIndex(oi)} />
                     {opt}
                  </label>
               ))}
            </>
         );

      case "spectrum":
         return (
            <>
               <div className="eval-image-row">
                  <QuizPatternImage entryId={question.entryId} overrides={question.overrides} />
               </div>
               {question.options.map((opt, oi) => (
                  <label key={oi} className="eval-option">
                     <input type="radio" name={question.id} checked={selected === oi} onChange={() => onSelectIndex(oi)} />
                     {opt}
                  </label>
               ))}
            </>
         );

      case "predict":
         return (
            <>
               <div className="eval-image-row">
                  <QuizPatternImage entryId={question.entryId} overrides={question.startOverrides} label="Before" />
               </div>
               <p className="eval-change-desc">{question.changeDescription}</p>
               <div className="eval-image-grid">
                  {question.candidates.map((c, ci) => (
                     <QuizPatternImage
                        key={ci}
                        entryId={question.entryId}
                        overrides={c.overrides}
                        label={String.fromCharCode(65 + ci)}
                        selected={selected === ci}
                        onClick={() => onSelectIndex(ci)}
                     />
                  ))}
               </div>
            </>
         );

      case "concept-match":
         return (
            <div className="eval-image-grid">
               {question.candidates.map((c, ci) => (
                  <QuizPatternImage
                     key={ci}
                     entryId={c.entryId}
                     overrides={c.overrides}
                     label={String.fromCharCode(65 + ci)}
                     selected={selected === ci}
                     onClick={() => onSelectIndex(ci)}
                  />
               ))}
            </div>
         );

      case "node-select":
         return (
            <>
               <div className="eval-image-row">
                  <QuizPatternImage entryId={question.entryId} overrides={question.overrides} label="Target pattern" />
               </div>
               {question.nodeOptions.map((node) => (
                  <label key={node} className="eval-option">
                     <input
                        type="checkbox"
                        checked={(selected ?? []).includes(node)}
                        onChange={() => onToggleNode(node)}
                     />
                     {node}
                  </label>
               ))}
            </>
         );

      case "order":
         return (
            <>
               <div className="eval-image-row">
                  <QuizPatternImage entryId={question.entryId} overrides={question.overrides} label="Target pattern" />
               </div>
               <div className="eval-order-list">
                  {question.nodeSequence.map((node) => (
                     <label key={node} className="eval-order-row">
                        <span className="eval-order-node">{node}</span>
                        <select
                           value={selected?.[node] ?? ""}
                           onChange={(e) => onSetOrder(node, e.target.value)}
                           aria-label={`Position for ${node}`}
                        >
                           <option value="" disabled>
                              Position
                           </option>
                           {question.nodeSequence.map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                 {i + 1}
                              </option>
                           ))}
                        </select>
                     </label>
                  ))}
               </div>
            </>
         );

      default: // "mc"
         return question.options.map((opt, oi) => (
            <label key={oi} className="eval-option">
               <input type="radio" name={question.id} checked={selected === oi} onChange={() => onSelectIndex(oi)} />
               {opt}
            </label>
         ));
   }
}

function QuizForm({ phase, questions, onSubmit }) {
   const [answers, setAnswers] = useState({});
   const allAnswered = questions.every((q) => isAnswered(q, answers));

   function setAnswer(id, value) {
      setAnswers((prev) => ({ ...prev, [id]: value }));
   }

   return (
      <div className="eval-quiz">
         <h3>{phase === "pre" ? "Before you start" : "After exploring"} — quick check</h3>
         <p className="eval-quiz-note">
            {questions.length} short questions, no time limit. This isn't graded or
            shown to you as pass/fail — it's research data for the dissertation this
            application supports.
         </p>
         {questions.map((q, qi) => (
            <fieldset key={q.id} className="eval-question">
               <legend>
                  {qi + 1}. {q.prompt}
               </legend>
               <QuestionBody
                  question={q}
                  selected={answers[q.id]}
                  onSelectIndex={(idx) => setAnswer(q.id, idx)}
                  onToggleNode={(node) => setAnswer(q.id, toggleNode(answers[q.id], node))}
                  onSetOrder={(node, position) => setAnswer(q.id, setOrderPosition(answers[q.id], node, position))}
               />
            </fieldset>
         ))}
         <button className="btn" disabled={!allAnswered} onClick={() => onSubmit(answers)}>
            Submit
         </button>
      </div>
   );
}

export default function EvaluationOverlay({ onClose, study = 1 }) {
   const config = STUDY_CONFIG[study];
   const [stage, setStage] = useState("intro"); // "intro" | "quiz" | "summary"
   const [phase, setPhase] = useState("pre"); // "pre" | "post"
   const [hasPre, setHasPre] = useState(() => hasStoredPhase("pre", config.storageKey));
   const [hasPost, setHasPost] = useState(() => hasStoredPhase("post", config.storageKey));
   // Set on Clear Stored Responses, cleared again once the user starts a new
   // quiz pass — a one-off confirmation, not a persistent status like the
   // pre/post dots above.
   const [justCleared, setJustCleared] = useState(false);

   function startQuiz(nextPhase) {
      setJustCleared(false);
      setPhase(nextPhase);
      setStage("quiz");
   }

   function submitQuiz(answers) {
      // Score is recorded but never read back here — kept hidden until
      // download (see docs/design/APP_IMPLEMENTATION_NOTES.md).
      recordQuizPass(phase, config.questions, answers, config.storageKey);
      if (phase === "pre") setHasPre(true);
      else setHasPost(true);
      setStage("summary");
   }

   function downloadResults() {
      const records = getAllRecords(config.storageKey);
      download(JSON.stringify(records, null, 2), `${config.filenamePrefix}-${Date.now()}.json`);
   }

   function clearResults() {
      clearAllRecords(config.storageKey);
      setHasPre(false);
      setHasPost(false);
      setJustCleared(true);
   }

   return (
      <div className="eval-overlay">
         <div className="eval-panel">
            <button className="eval-close" onClick={onClose} aria-label="Close evaluation">
               ×
            </button>

            {stage === "intro" && (
               <div className="eval-intro">
                  <h2>{config.label}</h2>
                  <p>{config.intro}</p>
                  <p>
                     Responses are stored only on this device (no account, no server) —
                     you can download them as a file at the end to share with the study
                     runner.
                  </p>
                  <StorageStatus hasPre={hasPre} hasPost={hasPost} />
                  {justCleared && (
                     <p className="eval-cleared-confirmation" role="status">
                        Stored responses successfully cleared.
                     </p>
                  )}
                  <div className="eval-actions">
                     <button className="btn" onClick={() => startQuiz("pre")}>
                        Take Pre-Quiz
                     </button>
                     <button className="btn" onClick={() => startQuiz("post")}>
                        Take Post-Quiz
                     </button>
                     <button className="btn" onClick={downloadResults}>
                        Download My Results
                     </button>
                     <button className="btn" onClick={clearResults}>
                        Clear Stored Responses
                     </button>
                  </div>
               </div>
            )}

            {stage === "quiz" && <QuizForm phase={phase} questions={config.questions} onSubmit={submitQuiz} />}

            {stage === "summary" && (
               <div className="eval-summary">
                  <h2>Thanks!</h2>
                  <p>
                     {phase === "pre" ? "Pre-quiz" : "Post-quiz"} recorded. Results aren't
                     shown here — download your results at the end to see them.
                  </p>
                  <StorageStatus hasPre={hasPre} hasPost={hasPost} />
                  {phase === "pre" && (
                     <p>Now go explore a few generators, then come back and take the post-quiz.</p>
                  )}
                  <div className="eval-actions">
                     <button className="btn" onClick={() => setStage("intro")}>
                        Back
                     </button>
                     <button className="btn" onClick={onClose}>
                        Return to Explorer
                     </button>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
