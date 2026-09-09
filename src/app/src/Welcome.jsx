/*
========================================
WELCOME
========================================
* First-run landing popup shown once before Onboarding.jsx's tour — same
* "onboarding-dismissed" localStorage flag gates both, as one combined flow.
* Calls out the Hybrid pattern category by name since it's easy to miss at
* the bottom of Generator Selection's list.
*/

import "./Welcome.css";

export default function Welcome({ onStartTour, onSkip }) {
   return (
      <div className="welcome-root">
         <div className="welcome-card">
            <h1 className="welcome-title">Pattinator</h1>
            <p className="welcome-subtitle">An algorithmic pattern explorer</p>
            <p className="welcome-body">
               This app shows you how generative art patterns are built, one computational step at a
               time. Pick a pattern, watch it come together stage by stage, and see explanations of
               what each step does and why.
            </p>
            <p className="welcome-body">
               Take a look through all the pattern types on offer — including the Hybrid patterns,
               which combine two different techniques into one pattern. They're some of the most
               interesting results in the app.
            </p>
            <div className="welcome-actions">
               <button className="btn welcome-skip" onClick={onSkip}>
                  Skip
               </button>
               <button className="btn welcome-start" onClick={onStartTour}>
                  Take the tour
               </button>
            </div>
         </div>
      </div>
   );
}
