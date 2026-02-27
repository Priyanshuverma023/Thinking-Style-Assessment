'use strict';

(function () {

  const STORAGE_KEY = 'tsa_v2_session';

  const ASSESSMENT_MODES = [
    { id: 'full',    label: 'Full',    detail: '60 questions',  questionsPerCat: 20 },
    { id: 'quick',   label: 'Quick',   detail: '30 questions',  questionsPerCat: 10 },
    { id: 'focused', label: 'Focused', detail: '15 questions',  questionsPerCat: 5  },
  ];

  const CATEGORIES = [
    { id: 'analytical', label: 'Analytical', color: '#2563eb' },
    { id: 'creative',   label: 'Creative',   color: '#7c3aed' },
    { id: 'practical',  label: 'Practical',  color: '#059669' },
  ];


  const LIKERT_SCALE = [
    { label: 'Strongly Agree',    value: 5, color: '#22c55e' },
    { label: 'Agree',             value: 4, color: '#86efac' },
    { label: 'Neutral',           value: 3, color: '#fbbf24' },
    { label: 'Disagree',          value: 2, color: '#fb923c' },
    { label: 'Strongly Disagree', value: 1, color: '#ef4444' },
  ];

  const FREQ_SCALE = [
    { label: 'Always',    value: 5, color: '#22c55e' },
    { label: 'Often',     value: 4, color: '#86efac' },
    { label: 'Sometimes', value: 3, color: '#fbbf24' },
    { label: 'Rarely',    value: 2, color: '#fb923c' },
    { label: 'Never',     value: 1, color: '#ef4444' },
  ];

  const TYPE_LABELS = {
    likert:    'Agree / Disagree',
    freq:      'Frequency',
    choice:    'Scenario',
    truefalse: 'True or False',
  };

  /* answer-label lookup used by PDF export */
  function answerLabel(q, value) {
    if (value === 'skipped') return 'Skipped';
    if (value === undefined || value === null) return 'Not answered';
    if (q.type === 'truefalse') {
      /* we stored which key (true/false) was pressed in state.answeredKey */
      const key = (state.answeredKey || {})[q.id];
      if (key) return key.charAt(0).toUpperCase() + key.slice(1);
      return value === 5 ? 'True' : 'False';
    }
    if (q.type === 'choice') {
      const closest = q.options.reduce((best, o) => {
        return Math.abs(choiceToScore(o.score) - value) <
               Math.abs(choiceToScore(best.score) - value) ? o : best;
      }, q.options[0]);
      return closest.label;
    }
    const scale = q.type === 'freq' ? FREQ_SCALE : LIKERT_SCALE;
    const opt   = scale.find(s => s.value === value);
    return opt ? opt.label : String(value);
  }

  /* maps choice option score (1-4) to 1-5 numeric range */
  function choiceToScore(s) { return 1 + ((s - 1) / 3) * 4; }

  const QUESTION_POOLS = {

    analytical: [
      /* LIKERT */
      { id:'an_l01', type:'likert', text:'When I evaluate an argument, I first check whether its conclusion actually follows from its stated premises.' },
      { id:'an_l02', type:'likert', text:'I can distinguish between a strong argument supported by evidence and a weak argument that relies on emotion or irrelevant facts.' },
      { id:'an_l03', type:'likert', text:'When someone makes a claim, I naturally ask what evidence would be needed to confirm or refute it.' },
      { id:'an_l04', type:'likert', text:'I notice when an argument draws a broad conclusion from a single or unrepresentative example.' },
      { id:'an_l05', type:'likert', text:'I regularly identify unstated assumptions hidden inside arguments before accepting their conclusions.' },
      { id:'an_l06', type:'likert', text:'Before accepting a causal claim, I consider whether the relationship could be correlation rather than causation.' },
      { id:'an_l07', type:'likert', text:'When faced with a complex problem, I systematically break it down into smaller components before attempting a solution.' },
      { id:'an_l08', type:'likert', text:'I rely primarily on data and evidence when making important decisions, rather than intuition alone.' },
      { id:'an_l09', type:'likert', text:'Before drawing conclusions, I carefully consider all available evidence and look for potential counterarguments.' },
      { id:'an_l10', type:'likert', text:'I prefer to map out all possible outcomes before committing to a course of action.' },
      { id:'an_l11', type:'likert', text:'When I read a report, I separate what is explicitly stated from what is being implied.' },
      { id:'an_l12', type:'likert', text:'I am cautious about drawing firm conclusions when available data is incomplete or ambiguous.' },
      { id:'an_l13', type:'likert', text:'I actively look for flaws in my own reasoning before presenting an argument to others.' },
      { id:'an_l14', type:'likert', text:'I regularly use quantitative methods — charts, models, or calculations — to support my reasoning.' },
      { id:'an_l15', type:'likert', text:'I find it more satisfying to produce a precisely correct answer than a roughly good one.' },
      { id:'an_l16', type:'likert', text:'I evaluate risks by estimating probabilities and magnitudes rather than relying on instinct.' },
      { id:'an_l17', type:'likert', text:'I regularly revise my conclusions when new evidence emerges, even if it contradicts my prior beliefs.' },
      { id:'an_l18', type:'likert', text:'I cross-check results using alternative methods to verify accuracy before sharing findings.' },

      /* FREQ */
      { id:'an_f01', type:'freq', text:'I notice logical inconsistencies or gaps in arguments before others point them out.' },
      { id:'an_f02', type:'freq', text:'I systematically test hypotheses by changing one variable at a time rather than making multiple changes at once.' },
      { id:'an_f03', type:'freq', text:'I find it natural to define edge cases and boundary conditions before beginning any implementation.' },
      { id:'an_f04', type:'freq', text:'I assess how much weight a piece of evidence should carry, rather than treating all evidence as equally important.' },
      { id:'an_f05', type:'freq', text:'When I encounter contradictory information, I seek additional sources to resolve the inconsistency.' },
      { id:'an_f06', type:'freq', text:'I document my reasoning process so others can audit and verify my conclusions.' },
      { id:'an_f07', type:'freq', text:'I use structured frameworks — categories, hierarchies, numbered lists — when organising complex information.' },
      { id:'an_f08', type:'freq', text:'After reaching a conclusion, I ask "what would change my mind?" before finalising my position.' },
      { id:'an_f09', type:'freq', text:'I focus on logical validity and evidence quality when evaluating others\' arguments.' },
      { id:'an_f10', type:'freq', text:'I ask "why does this work?" rather than accepting a working solution at face value.' },
      { id:'an_f11', type:'freq', text:'I define clear, measurable success criteria before starting a complex task.' },
      { id:'an_f12', type:'freq', text:'I separate emotions from analytical tasks, treating them as distinct activities.' },

      /* CHOICE */
      { id:'an_c01', type:'choice',
        text:'A colleague presents data showing a 30% increase in sales after a new campaign. They conclude the campaign caused the increase. What do you do first?',
        options:[
          { label:'Ask whether any other factors changed during the same period', score:4 },
          { label:'Accept the data — a 30% increase is substantial evidence', score:1 },
          { label:'Share the finding with leadership before questioning it', score:1 },
          { label:'Ask for the raw dataset to do your own analysis', score:3 },
        ]},
      { id:'an_c02', type:'choice',
        text:'You are reviewing a project report and notice one key assumption is never stated explicitly. You:',
        options:[
          { label:'Flag the assumption explicitly and assess its impact on the conclusions', score:4 },
          { label:'Proceed — assumptions are implied and experienced readers will understand', score:1 },
          { label:'Add a footnote mentioning there may be assumptions at play', score:2 },
          { label:'Ask the author to clarify verbally, then continue', score:3 },
        ]},
      { id:'an_c03', type:'choice',
        text:'Two data sources give conflicting numbers for the same metric. You need to present findings tomorrow. You:',
        options:[
          { label:'Investigate the source of the discrepancy before the presentation', score:4 },
          { label:'Use the higher number — it shows stronger results', score:1 },
          { label:'Present both numbers with a note that they are under investigation', score:3 },
          { label:'Choose the source that seems more authoritative', score:2 },
        ]},
      { id:'an_c04', type:'choice',
        text:'You have been asked to evaluate a proposed solution. After analysis you believe it is flawed. The proposer is a senior stakeholder. You:',
        options:[
          { label:'Present your analysis clearly, with evidence, and propose an alternative', score:4 },
          { label:'Privately flag your concern to your manager and let them decide', score:2 },
          { label:'Support the proposal — senior stakeholders usually have more context', score:1 },
          { label:'Request more time to review before sharing concerns', score:3 },
        ]},
      { id:'an_c05', type:'choice',
        text:'You run an experiment and the results are ambiguous — neither confirming nor disconfirming your hypothesis. You:',
        options:[
          { label:'Acknowledge the ambiguity and design a follow-up test to resolve it', score:4 },
          { label:'Interpret the ambiguity as partial confirmation of the hypothesis', score:1 },
          { label:'Report the results accurately and note the limitations', score:3 },
          { label:'Discard the experiment and try a completely different approach', score:2 },
        ]},
      { id:'an_c06', type:'choice',
        text:'A widely used process at your organisation appears to be inefficient. Everyone follows it without question. You:',
        options:[
          { label:'Investigate why the process exists, then propose improvements with evidence', score:4 },
          { label:'Follow the process — it has been validated over time', score:1 },
          { label:'Raise the issue informally with a colleague to gauge their view', score:2 },
          { label:'Document the inefficiency and wait for a formal review cycle', score:3 },
        ]},
      { id:'an_c07', type:'choice',
        text:'You are asked to validate a model built by another team. It produces accurate outputs but you cannot explain why. You:',
        options:[
          { label:'Dig deeper to understand the mechanism before validating it', score:4 },
          { label:'Validate it — if outputs are accurate, the mechanism is secondary', score:1 },
          { label:'Validate it but document that the mechanism is not yet understood', score:3 },
          { label:'Ask the other team to explain it before you proceed', score:2 },
        ]},
      { id:'an_c08', type:'choice',
        text:'You discover your conclusion from last month was based on incorrect data. The decision it informed has already been made. You:',
        options:[
          { label:'Disclose the error immediately, reassess the decision, and correct the record', score:4 },
          { label:'Wait to see if the decision causes a problem before raising it', score:1 },
          { label:'Quietly update your records and correct it next time', score:1 },
          { label:'Notify your manager privately and let them decide how to handle it', score:2 },
        ]},
      { id:'an_c09', type:'choice',
        text:'You are reviewing a strong argument that leads to a conclusion you personally dislike. You:',
        options:[
          { label:'Evaluate the argument on its logic and evidence, independent of your preference', score:4 },
          { label:'Look harder for flaws in the argument to find grounds to reject it', score:1 },
          { label:'Accept the logic but present alternative conclusions alongside it', score:2 },
          { label:'Share it with a neutral third party to validate your assessment', score:3 },
        ]},

      /* TRUE/FALSE */
      { id:'an_t01', type:'truefalse', correct:'true',
        text:'A logically valid argument can still have a false conclusion if one of its premises is false.' },
      { id:'an_t02', type:'truefalse', correct:'false',
        text:'Correlation between two variables is sufficient evidence to conclude that one causes the other.' },
      { id:'an_t03', type:'truefalse', correct:'true',
        text:'A conclusion can be "probably true" based on strong evidence without being definitively proven.' },
      { id:'an_t04', type:'truefalse', correct:'false',
        text:'If a study used a large sample size, its findings are always reliable and free from bias.' },
      { id:'an_t05', type:'truefalse', correct:'true',
        text:'An argument that relies heavily on emotional language rather than evidence is generally weaker than one that does not.' },
      { id:'an_t06', type:'truefalse', correct:'false',
        text:'When two pieces of information contradict each other, one of them must be deliberately misleading.' },
    ],

    creative: [
      /* LIKERT */
      { id:'cr_l01', type:'likert', text:'I often approach a problem by reframing it completely rather than solving it as originally stated.' },
      { id:'cr_l02', type:'likert', text:'I enjoy generating large numbers of ideas, even impractical ones, before narrowing down.' },
      { id:'cr_l03', type:'likert', text:'I naturally make connections between ideas from completely different domains.' },
      { id:'cr_l04', type:'likert', text:'I am comfortable producing and sharing rough, unfinished ideas before they are fully formed.' },
      { id:'cr_l05', type:'likert', text:'I prefer open-ended problems over ones with a single correct answer.' },
      { id:'cr_l06', type:'likert', text:'I use metaphors and analogies naturally when explaining complex ideas.' },
      { id:'cr_l07', type:'likert', text:'I regularly challenge the constraints of a brief before working within them.' },
      { id:'cr_l08', type:'likert', text:'I find that some of my best ideas emerge from unrelated activities — walking, reading, or relaxing.' },
      { id:'cr_l09', type:'likert', text:'I treat failure as a necessary step in the creative process, not as something to avoid.' },
      { id:'cr_l10', type:'likert', text:'I can see elegance in a solution even before testing whether it works.' },
      { id:'cr_l11', type:'likert', text:'I regularly combine existing concepts in novel ways to produce something genuinely new.' },
      { id:'cr_l12', type:'likert', text:'I prefer iterative progress — small improvements frequently — over waiting to perfect something before releasing it.' },
      { id:'cr_l13', type:'likert', text:'I am energised, rather than paralysed, by ambiguity and open-ended questions.' },
      { id:'cr_l14', type:'likert', text:'I tend to think visually — using diagrams, sketches, or spatial reasoning naturally.' },
      { id:'cr_l15', type:'likert', text:'When I am stuck on a problem, I deliberately shift perspective by changing my environment or inputs.' },
      { id:'cr_l16', type:'likert', text:'I find inspiration in domains far outside my immediate field of expertise.' },
      { id:'cr_l17', type:'likert', text:'I can hold contradictory ideas in mind simultaneously without immediately resolving the tension.' },
      { id:'cr_l18', type:'likert', text:'I experiment as a thinking tool — I try things not to get answers but to discover better questions.' },

      /* FREQ */
      { id:'cr_f01', type:'freq', text:'I generate ideas that surprise even people who know me well.' },
      { id:'cr_f02', type:'freq', text:'I make unexpected connections between ideas while doing apparently unrelated activities.' },
      { id:'cr_f03', type:'freq', text:'I question the framing or constraints of a problem before trying to solve it.' },
      { id:'cr_f04', type:'freq', text:'I produce creative output under time pressure without the quality suffering significantly.' },
      { id:'cr_f05', type:'freq', text:'I seek out diverse inputs — art, science, culture, nature — to fuel my creative thinking.' },
      { id:'cr_f06', type:'freq', text:'I apply techniques from one field to solve problems in a completely different field.' },
      { id:'cr_f07', type:'freq', text:'I defer judgment when generating ideas, allowing even silly or impractical ones to exist at first.' },
      { id:'cr_f08', type:'freq', text:'I capture ideas the moment they emerge, knowing they may be lost if not recorded.' },
      { id:'cr_f09', type:'freq', text:'I revisit and build on half-formed ideas that others might discard.' },
      { id:'cr_f10', type:'freq', text:'I present creative ideas in ways that help others visualise them, even without finished materials.' },
      { id:'cr_f11', type:'freq', text:'I use constraints deliberately as creative catalysts — asking "What if we could only use X?"' },
      { id:'cr_f12', type:'freq', text:'I generate at least three distinct alternatives before committing to a creative direction.' },

      /* CHOICE */
      { id:'cr_c01', type:'choice',
        text:'You are asked to redesign an internal process that everyone has used for five years. Your first instinct is to:',
        options:[
          { label:'Question why the process exists and what it was originally designed to achieve', score:4 },
          { label:'Map the current process in full before changing anything', score:3 },
          { label:'Research how other companies handle the same process', score:2 },
          { label:'Improve the weakest points of the existing process', score:1 },
        ]},
      { id:'cr_c02', type:'choice',
        text:'You are in a brainstorm and the team is converging too early on one idea. You:',
        options:[
          { label:'Re-open the space by proposing: no evaluation until we have 10 options', score:4 },
          { label:'Go along with the group — convergence is a sign of progress', score:1 },
          { label:'Quietly ask if anyone has other ideas before the vote', score:2 },
          { label:'Suggest deferring the decision for 24 hours so more ideas can surface', score:3 },
        ]},
      { id:'cr_c03', type:'choice',
        text:'You receive a vague brief: "make something new for our audience." You:',
        options:[
          { label:'Explore multiple completely different interpretations of "new" before narrowing down', score:4 },
          { label:'Ask for a more detailed brief before starting', score:2 },
          { label:'Start with what has worked before and add a twist', score:1 },
          { label:'Research what competitors are doing for inspiration', score:2 },
        ]},
      { id:'cr_c04', type:'choice',
        text:'Your most creative idea has just been rejected as "too radical." You:',
        options:[
          { label:'Explore why it felt radical and whether a modified version is worth pursuing', score:4 },
          { label:'Scale back the idea to something safer and resubmit', score:2 },
          { label:'Accept the rejection and move to your next idea', score:1 },
          { label:'Find allies who might help champion it internally', score:3 },
        ]},
      { id:'cr_c05', type:'choice',
        text:'You are stuck on a creative challenge and have been for two hours. You:',
        options:[
          { label:'Deliberately change your environment and return with fresh eyes', score:4 },
          { label:'Keep pushing — creative breakthroughs come from persistence', score:2 },
          { label:'Ask a colleague with a completely different background for their take', score:3 },
          { label:'Simplify the challenge by removing the most difficult constraint', score:2 },
        ]},
      { id:'cr_c06', type:'choice',
        text:'A team member dismisses your creative suggestion as "not how we do things." You:',
        options:[
          { label:'Make a case for why trying something new has low downside risk', score:4 },
          { label:'Drop it — they have more context than you do', score:1 },
          { label:'Explore with genuine curiosity why the current way exists', score:3 },
          { label:'Try it on a smaller scale first and show results', score:3 },
        ]},
      { id:'cr_c07', type:'choice',
        text:'You are given two hours to produce an innovative concept for a new product. You:',
        options:[
          { label:'Spend the first 30 minutes generating as many directions as possible, then narrow to one', score:4 },
          { label:'Go with your first strong instinct and develop it fully', score:2 },
          { label:'Research similar products and identify an uncovered space', score:2 },
          { label:'Pick the safest option you can execute well', score:1 },
        ]},
      { id:'cr_c08', type:'choice',
        text:'You think of an unconventional solution but are unsure it will work. You:',
        options:[
          { label:'Outline the idea, identify how to test it quickly, and prototype it', score:4 },
          { label:'Keep it to yourself until you are more confident', score:1 },
          { label:'Share it as a "wild idea" and gauge reactions before committing', score:3 },
          { label:'Develop a safer parallel solution in case the unconventional one fails', score:2 },
        ]},
      { id:'cr_c09', type:'choice',
        text:'You need to communicate a complex concept to a non-expert audience. You:',
        options:[
          { label:'Find a metaphor or story that maps the concept to something familiar', score:4 },
          { label:'Simplify the language while preserving the technical structure', score:2 },
          { label:'Use visuals — diagrams or illustrations — to carry the meaning', score:3 },
          { label:'Provide a glossary of terms so they can follow accurately', score:1 },
        ]},

      /* TRUE/FALSE */
      { id:'cr_t01', type:'truefalse', correct:'true',
        text:'Divergent thinking — generating many different ideas — is more valuable in the early stages of a creative process than in the later stages.' },
      { id:'cr_t02', type:'truefalse', correct:'false',
        text:'Truly creative people work best in silence and isolation, without input from others.' },
      { id:'cr_t03', type:'truefalse', correct:'true',
        text:'Imposing deliberate constraints on a creative problem can sometimes lead to more innovative solutions.' },
      { id:'cr_t04', type:'truefalse', correct:'false',
        text:'Brainstorming sessions are most effective when participants evaluate ideas as they are generated.' },
      { id:'cr_t05', type:'truefalse', correct:'true',
        text:'Reframing a problem — changing how it is defined — is often as valuable as solving the original problem directly.' },
      { id:'cr_t06', type:'truefalse', correct:'false',
        text:'Creative thinking is a fixed trait — you either have it or you do not.' },
    ],

    /* ============================================================
       PRACTICAL  (18 likert · 12 freq · 9 choice · 6 truefalse)
    ============================================================ */
    practical: [
      /* LIKERT */
      { id:'pr_l01', type:'likert', text:'When I start a project, I define clear milestones before writing a single line of work.' },
      { id:'pr_l02', type:'likert', text:'I naturally identify the minimum viable version of a deliverable before adding scope.' },
      { id:'pr_l03', type:'likert', text:'I am comfortable making quick decisions under pressure even when information is incomplete.' },
      { id:'pr_l04', type:'likert', text:'I manage expectations proactively — I tell people about problems before they escalate.' },
      { id:'pr_l05', type:'likert', text:'I regularly prioritise tasks by asking "what is the most valuable thing I can finish today?"' },
      { id:'pr_l06', type:'likert', text:'I can translate a high-level strategy into a concrete, step-by-step execution plan.' },
      { id:'pr_l07', type:'likert', text:'I protect my team\'s focus by actively pushing back on unnecessary meetings or distractions.' },
      { id:'pr_l08', type:'likert', text:'I am comfortable saying no to new requests when they would compromise delivery of the current commitment.' },
      { id:'pr_l09', type:'likert', text:'When a solution is not working, I switch approaches quickly rather than persisting due to sunk-cost thinking.' },
      { id:'pr_l10', type:'likert', text:'I find satisfaction in making a complex process simple enough that anyone on the team can follow it.' },
      { id:'pr_l11', type:'likert', text:'I ensure every meeting ends with clear owners, actions, and deadlines rather than open-ended next steps.' },
      { id:'pr_l12', type:'likert', text:'I treat user feedback as primary input when deciding what to build or improve next.' },
      { id:'pr_l13', type:'likert', text:'I consistently deliver what I commit to, on time, even when circumstances change.' },
      { id:'pr_l14', type:'likert', text:'I adapt my plan when new information emerges rather than rigidly sticking to the original.' },
      { id:'pr_l15', type:'likert', text:'I identify the single biggest blocker to a goal and remove it before addressing anything else.' },
      { id:'pr_l16', type:'likert', text:'I break goals into the smallest possible meaningful tasks so progress is visible daily.' },
      { id:'pr_l17', type:'likert', text:'I evaluate trade-offs explicitly — cost vs. benefit, speed vs. quality — rather than optimising for one variable.' },
      { id:'pr_l18', type:'likert', text:'I regularly reflect on my own working habits and adjust them to improve personal effectiveness.' },

      /* FREQ */
      { id:'pr_f01', type:'freq', text:'I deliver work by the deadline I committed to, without needing reminders.' },
      { id:'pr_f02', type:'freq', text:'I raise risks or blockers as soon as I identify them, rather than waiting until they become problems.' },
      { id:'pr_f03', type:'freq', text:'I actively remove steps from processes that do not add clear value.' },
      { id:'pr_f04', type:'freq', text:'I re-examine my priorities at the start of each day rather than defaulting to yesterday\'s list.' },
      { id:'pr_f05', type:'freq', text:'I ship work in small increments to get early feedback rather than building in isolation.' },
      { id:'pr_f06', type:'freq', text:'I check in with stakeholders proactively to manage expectations rather than waiting to be asked.' },
      { id:'pr_f07', type:'freq', text:'I track open tasks explicitly — in a system, not just in memory.' },
      { id:'pr_f08', type:'freq', text:'I estimate how long tasks will take before starting, even if the estimate is uncertain.' },
      { id:'pr_f09', type:'freq', text:'I focus on outcomes — what was actually achieved — rather than effort alone.' },
      { id:'pr_f10', type:'freq', text:'I reduce the scope of a deliverable when the deadline cannot move rather than delivering late.' },
      { id:'pr_f11', type:'freq', text:'I identify who needs to be involved in a decision and get them in the room early.' },
      { id:'pr_f12', type:'freq', text:'I run a quick retrospective after completing significant work to capture what I would do differently.' },

      /* CHOICE */
      { id:'pr_c01', type:'choice',
        text:'You have three equally important tasks and only time to complete one today. You:',
        options:[
          { label:'Assess impact and urgency, then complete the highest-value task first', score:4 },
          { label:'Start with the easiest to build momentum', score:2 },
          { label:'Ask your manager which to prioritise', score:3 },
          { label:'Try to do parts of all three and deliver none fully', score:1 },
        ]},
      { id:'pr_c02', type:'choice',
        text:'You are halfway through a project when you learn the original approach will not achieve the goal. You:',
        options:[
          { label:'Stop, reassess, and pivot to a better approach — even if it means redoing work', score:4 },
          { label:'Continue to completion — abandoning midway wastes the effort already invested', score:1 },
          { label:'Finish the current phase, then propose a redirect at the next milestone', score:3 },
          { label:'Escalate to your manager for a decision', score:2 },
        ]},
      { id:'pr_c03', type:'choice',
        text:'A project is running two weeks behind and the deadline cannot move. You:',
        options:[
          { label:'Identify what can be cut from scope while still meeting the core objective', score:4 },
          { label:'Push the team to work harder and longer hours to make up the time', score:2 },
          { label:'Inform stakeholders of the delay and negotiate a revised deadline', score:3 },
          { label:'Deliver what is ready and quietly add the rest later without announcing the gap', score:1 },
        ]},
      { id:'pr_c04', type:'choice',
        text:'You are asked to estimate a project timeline with significant unknowns. You:',
        options:[
          { label:'Give a range with explicit assumptions and flag what would change the estimate', score:4 },
          { label:'Refuse to estimate until all unknowns are resolved', score:1 },
          { label:'Give a single number with a buffer built in without mentioning the uncertainties', score:2 },
          { label:'Give your best single estimate and note the key assumptions verbally', score:3 },
        ]},
      { id:'pr_c05', type:'choice',
        text:'A stakeholder keeps adding new requirements during delivery. You:',
        options:[
          { label:'Document each request, assess its impact on timeline and scope, and get explicit sign-off before acting', score:4 },
          { label:'Absorb the requests and try to fit them in without discussion', score:1 },
          { label:'Refuse all new requirements — scope is locked', score:2 },
          { label:'Add them to a backlog for a future phase and continue current delivery', score:3 },
        ]},
      { id:'pr_c06', type:'choice',
        text:'You discover that a process your team uses regularly is producing unreliable outputs. You:',
        options:[
          { label:'Stop using the process immediately, diagnose the root cause, and fix it before continuing', score:4 },
          { label:'Flag it in the next team meeting and wait for collective agreement before changing it', score:2 },
          { label:'Add a manual check downstream to catch the errors', score:2 },
          { label:'Note the issue but keep using the process to avoid disruption', score:1 },
        ]},
      { id:'pr_c07', type:'choice',
        text:'You are asked to ship a feature that is technically working but not yet polished. The deadline is tomorrow. You:',
        options:[
          { label:'Ship it with known limitations clearly documented for users', score:4 },
          { label:'Miss the deadline to ensure it is polished before shipping', score:2 },
          { label:'Ship it and quietly fix the issues after without telling anyone', score:1 },
          { label:'Ask stakeholders which limitations they can tolerate and ship based on their decision', score:3 },
        ]},
      { id:'pr_c08', type:'choice',
        text:'Two senior stakeholders disagree on a key product decision and are both waiting for you to move forward. You:',
        options:[
          { label:'Facilitate a conversation between them with a concrete proposal and a decision deadline', score:4 },
          { label:'Pick one stakeholder\'s approach and proceed', score:1 },
          { label:'Escalate to your shared manager and wait for a resolution', score:2 },
          { label:'Delay the decision until consensus forms naturally', score:2 },
        ]},
      { id:'pr_c09', type:'choice',
        text:'After delivery, user feedback shows the solution solves the wrong problem. You:',
        options:[
          { label:'Acknowledge the misalignment, run discovery with users, and rebuild', score:4 },
          { label:'Document it as a known limitation and plan a v2 for next quarter', score:2 },
          { label:'Add new features to extend what was built and hope to cover the gap', score:1 },
          { label:'Analyse where the brief went wrong before deciding next steps', score:3 },
        ]},

      /* TRUE/FALSE */
      { id:'pr_t01', type:'truefalse', correct:'false',
        text:'Delivering a project on time and on budget is always a sign that the project was successful.' },
      { id:'pr_t02', type:'truefalse', correct:'true',
        text:'Reducing scope is a legitimate way to meet a deadline without compromising quality.' },
      { id:'pr_t03', type:'truefalse', correct:'false',
        text:'Adding more people to a late project will reliably speed up delivery.' },
      { id:'pr_t04', type:'truefalse', correct:'true',
        text:'A task that is 90% complete but not yet shipped delivers zero value to the end user.' },
      { id:'pr_t05', type:'truefalse', correct:'false',
        text:'The best way to improve a process is to fully document it before making any changes.' },
      { id:'pr_t06', type:'truefalse', correct:'true',
        text:'Proactively raising a problem early is nearly always better than waiting until it becomes a crisis.' },
    ],
  };

  /* ===========================================================
     INSIGHTS & CARDS
  =========================================================== */

  const INSIGHTS = {
    analytical: {
      type: 'Analytical Thinker',
      insight: 'You approach problems through the lens of logic, evidence, and structured reasoning. You thrive where clarity and precision matter — in data analysis, research, engineering, or strategic planning. Your strength is turning complexity into order.',
      strengths: ['Rigorous logical reasoning', 'Data-driven decision-making', 'Root-cause identification', 'Systematic framework building', 'Objective evaluation of evidence'],
      growth: ['Allow intuition to complement analysis in time-sensitive situations', 'Practice communicating insights to non-technical audiences', 'Embrace exploratory phases without premature closure'],
      roles: ['Data Analyst', 'Research Scientist', 'Systems Architect', 'Financial Analyst', 'Strategy Consultant'],
    },
    creative: {
      type: 'Creative Thinker',
      insight: 'You see possibilities where others see constraints. You thrive in ambiguity, generate novel ideas effortlessly, and communicate through story and metaphor. Your strength is innovation and the ability to reframe problems in ways others have not considered.',
      strengths: ['Generative ideation', 'Lateral and divergent thinking', 'Cross-domain synthesis', 'Expressive communication', 'Reframing and perspective shifts'],
      growth: ['Develop stronger habits around execution and follow-through', 'Build tolerance for analytical and process-driven phases', 'Channel creativity into structured problem definitions'],
      roles: ['UX Designer', 'Product Strategist', 'Creative Director', 'Innovation Consultant', 'Content Strategist'],
    },
    practical: {
      type: 'Practical Thinker',
      insight: 'You are a results-first thinker who translates strategy into action. You navigate constraints naturally, make fast decisions, and keep teams moving toward outcomes. Your strength is execution — delivering value in the real world, not just on paper.',
      strengths: ['Action-oriented execution', 'Pragmatic trade-off decisions', 'Stakeholder management', 'Iterative delivery', 'Removing blockers efficiently'],
      growth: ['Invest time in upstream problem definition before jumping to solutions', 'Develop comfort with exploratory and ambiguous phases', 'Build stronger analytical skills to complement instinctive decision-making'],
      roles: ['Project Manager', 'Operations Lead', 'Entrepreneur', 'Product Manager', 'Business Analyst'],
    },
  };

  /* ===========================================================
     STATE
  =========================================================== */

  let state = buildInitialState();

  function buildInitialState() {
    return {
      phase: 'welcome',
      userName: '',
      mode: ASSESSMENT_MODES[0],
      questions: [],
      answers: {},
      answeredKey: {},  /* tracks 'true'|'false' key pressed for truefalse questions */
      flagged: new Set(),
      activeCatIdx: 0,
      activeQIdx: 0,
      locked: false,
      reviewOnlyFlagged: false,
    };
  }

  const dom = {};

  function cacheDOM() {
    dom.appLoader          = document.getElementById('appLoader');
    dom.toastRegion        = document.getElementById('toastRegion');
    dom.confirmOverlay     = document.getElementById('confirmOverlay');
    dom.confirmTitle       = document.getElementById('confirmTitle');
    dom.confirmMsg         = document.getElementById('confirmMsg');
    dom.confirmOk          = document.getElementById('confirmOk');
    dom.confirmCancel      = document.getElementById('confirmCancel');

    dom.screenWelcome      = document.getElementById('screenWelcome');
    dom.screenQuestions    = document.getElementById('screenQuestions');
    dom.screenReview       = document.getElementById('screenReview');
    dom.screenResults      = document.getElementById('screenResults');

    dom.modeGrid           = document.getElementById('modeGrid');
    dom.statQuestions      = document.getElementById('statQuestions');
    dom.welcomeForm        = document.getElementById('welcomeForm');
    dom.inpName            = document.getElementById('inpName');
    dom.errName            = document.getElementById('errName');
    dom.btnBegin           = document.getElementById('btnBegin');
    dom.headerRight        = document.getElementById('headerRight');

    dom.catTabs            = document.getElementById('catTabs');
    dom.qDots              = document.getElementById('qDots');
    dom.qCatBadge          = document.getElementById('qCatBadge');
    dom.qCounter           = document.getElementById('qCounter');
    dom.qFlagIndicator     = document.getElementById('qFlagIndicator');
    dom.qText              = document.getElementById('qText');
    dom.optionsList        = document.getElementById('optionsList');
    dom.btnPrev            = document.getElementById('btnPrev');
    dom.btnFlag            = document.getElementById('btnFlag');
    dom.btnFlagLabel       = document.getElementById('btnFlagLabel');
    dom.btnSkip            = document.getElementById('btnSkip');
    dom.btnNext            = document.getElementById('btnNext');
    dom.completionStatus   = document.getElementById('completionStatus');
    dom.btnViewResults     = document.getElementById('btnViewResults');

    dom.reviewStats        = document.getElementById('reviewStats');
    dom.reviewCatsGrid     = document.getElementById('reviewCatsGrid');
    dom.reviewFlaggedBlock = document.getElementById('reviewFlaggedBlock');
    dom.reviewFlaggedList  = document.getElementById('reviewFlaggedList');
    dom.revBtnBack         = document.getElementById('revBtnBack');
    dom.revBtnFlagged      = document.getElementById('revBtnFlagged');
    dom.revBtnSubmit       = document.getElementById('revBtnSubmit');

    dom.resMeta            = document.getElementById('resMeta');
    dom.resCircle          = document.getElementById('resCircle');
    dom.resOverallPct      = document.getElementById('resOverallPct');
    dom.resOverallType     = document.getElementById('resOverallType');
    dom.scoreBarsSection   = document.getElementById('scoreBarsSection');
    dom.resInsight         = document.getElementById('resInsight');
    dom.resDetailGrid      = document.getElementById('resDetailGrid');
    dom.btnRestart         = document.getElementById('btnRestart');
    dom.btnPdf             = document.getElementById('btnPdf');
  }


  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let activeToast = null;
  let toastTimer  = null;

  function showToast(msg, type = 'info') {
    if (activeToast) {
      activeToast.classList.add('tsa--toast-out');
      const old = activeToast;
      setTimeout(() => old.remove(), 250);
    }
    if (toastTimer) clearTimeout(toastTimer);

    const el = document.createElement('div');
    el.className = 'tsa--toast';
    el.setAttribute('data-type', type);
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.textContent = msg;
    activeToast = el;
    dom.toastRegion.appendChild(el);

    requestAnimationFrame(() => el.classList.add('tsa--toast-in'));
    toastTimer = setTimeout(() => {
      el.classList.add('tsa--toast-out');
      setTimeout(() => el.remove(), 250);
      activeToast = null;
    }, 3500);
  }

  function showLoader() {
    if (dom.appLoader) { dom.appLoader.hidden = false; dom.appLoader.setAttribute('aria-busy', 'true'); }
  }

  function hideLoader() {
    if (dom.appLoader) { dom.appLoader.hidden = true; dom.appLoader.setAttribute('aria-busy', 'false'); }
  }

  let confirmResolve = null;

  function showConfirm(title, msg) {
    return new Promise(resolve => {
      confirmResolve = resolve;
      dom.confirmTitle.textContent = title;
      dom.confirmMsg.textContent   = msg;
      dom.confirmOverlay.hidden    = false;
      dom.confirmOk.focus();
    });
  }

  function showScreen(id) {
    [dom.screenWelcome, dom.screenQuestions, dom.screenReview, dom.screenResults].forEach(s => {
      s.classList.remove('active');
      s.hidden = s.id !== id;
    });
    const target = document.getElementById(id);
    if (target) { target.classList.add('active'); target.hidden = false; }
    state.phase = id;
  }

  /* ===========================================================
     QUESTION BUILDING
     Pool entries are full objects {id, type, text, ...}.
     We annotate each picked question with catId and catIdx.
  =========================================================== */

  function buildQuestions(mode) {
    const perCat = mode.questionsPerCat;
    const result = [];
    CATEGORIES.forEach((cat, catIdx) => {
      const pool   = QUESTION_POOLS[cat.id];
      const picked = shuffle(pool).slice(0, Math.min(perCat, pool.length));
      picked.forEach(q => {
        result.push(Object.assign({}, q, { catId: cat.id, catIdx }));
      });
    });
    return result;
  }

  function questionsForCat(catIdx) {
    return state.questions.filter(q => q.catIdx === catIdx);
  }

  function activeQuestions() { return questionsForCat(state.activeCatIdx); }
  function activeQuestion()  { return activeQuestions()[state.activeQIdx] || null; }

  /* ===========================================================
     SCORING
     All stored answer values are numeric 1–5 regardless of type.
     truefalse: correct → 5, wrong → 1
     choice: choiceToScore(opt.score) maps score 1-4 → value 1-5
  =========================================================== */

  function catScore(catIdx) {
    const qs = questionsForCat(catIdx);
    const answered = qs.filter(q => {
      const a = state.answers[q.id];
      return a !== undefined && a !== null && a !== 'skipped';
    });
    if (!answered.length) return null;
    const total = answered.reduce((s, q) => s + state.answers[q.id], 0);
    return Math.round((total / (answered.length * 5)) * 100);
  }

  function allScores() {
    return CATEGORIES.map((cat, i) => ({ cat, score: catScore(i) }));
  }

  function dominantType() {
    const scores = allScores().filter(s => s.score !== null);
    if (!scores.length) return null;
    return scores.reduce((best, cur) => cur.score > best.score ? cur : best, scores[0]);
  }

  function overallPct() {
    const valid = allScores().filter(s => s.score !== null);
    if (!valid.length) return 0;
    return Math.round(valid.reduce((s, v) => s + v.score, 0) / valid.length);
  }

  /* ===========================================================
     PROGRESS CHECKS
  =========================================================== */

  function answeredCount() {
    return Object.values(state.answers).filter(v => v !== null && v !== undefined && v !== 'skipped').length;
  }

  function skippedCount() {
    return Object.values(state.answers).filter(v => v === 'skipped').length;
  }

  function unansweredCount() {
    return state.questions.filter(q => state.answers[q.id] === undefined || state.answers[q.id] === null).length;
  }

  function catAnsweredCount(catIdx) {
    return questionsForCat(catIdx).filter(q => {
      const a = state.answers[q.id];
      return a !== undefined && a !== null && a !== 'skipped';
    }).length;
  }

  function catMeetsThreshold(catIdx) {
    const qs = questionsForCat(catIdx);
    return catAnsweredCount(catIdx) >= Math.ceil(qs.length * 0.5);
  }

  function allCatsMeetThreshold() {
    return CATEGORIES.every((_, i) => catMeetsThreshold(i));
  }

  function shortfallMessage() {
    return CATEGORIES
      .filter((_, i) => !catMeetsThreshold(i))
      .map(cat => {
        const i    = CATEGORIES.indexOf(cat);
        const qs   = questionsForCat(i);
        const need = Math.ceil(qs.length * 0.5);
        const have = catAnsweredCount(i);
        return `${cat.label}: ${have}/${need}`;
      })
      .join(' · ');
  }

  /* ===========================================================
     RENDER: WELCOME
  =========================================================== */

  function renderWelcome() {
    dom.modeGrid.innerHTML = '';
    ASSESSMENT_MODES.forEach((mode, i) => {
      const card    = document.createElement('div');
      card.className = 'tsa--mode-card';
      const inputId  = `mode_${mode.id}`;
      card.innerHTML = `
        <input type="radio" name="assessmentMode" id="${inputId}" value="${mode.id}" ${i === 0 ? 'checked' : ''} />
        <label class="tsa--mode-card-label" for="${inputId}">
          <span class="tsa--mode-name">${escHtml(mode.label)}</span>
          <span class="tsa--mode-detail">${escHtml(mode.detail)}</span>
        </label>
      `;
      card.querySelector('input').addEventListener('change', () => {
        state.mode = mode;
        updateStatDisplay();
      });
      dom.modeGrid.appendChild(card);
    });
    updateStatDisplay();
    showScreen('screenWelcome');
  }

  function updateStatDisplay() {
    if (dom.statQuestions) dom.statQuestions.textContent = state.mode.questionsPerCat * CATEGORIES.length;
  }

  /* ===========================================================
     RENDER: QUESTIONS
  =========================================================== */

  function renderQuestions() {
    renderCatTabs();
    renderDots();
    renderQuestionCard();
    updateCompletionStatus();
    showScreen('screenQuestions');
  }

  function renderCatTabs() {
    dom.catTabs.innerHTML = '';
    CATEGORIES.forEach((cat, i) => {
      const qs     = questionsForCat(i);
      const ans    = catAnsweredCount(i);
      const isDone = (ans + qs.filter(q => state.answers[q.id] === 'skipped').length) === qs.length;
      const tab    = document.createElement('button');
      tab.className  = `tsa--cat-tab${i === state.activeCatIdx ? ' active' : ''}${isDone ? ' done' : ''}`;
      tab.setAttribute('type', 'button');
      tab.innerHTML = `
        <span class="tsa--cat-tab-name">${escHtml(cat.label)}</span>
        <span class="tsa--cat-tab-count">${ans}/${qs.length}</span>
      `;
      tab.addEventListener('click', () => {
        state.activeCatIdx = i;
        state.activeQIdx   = 0;
        renderQuestions();
      });
      dom.catTabs.appendChild(tab);
    });
  }

  function renderDots() {
    dom.qDots.innerHTML = '';
    const qs = activeQuestions();
    qs.forEach((q, i) => {
      const dot     = document.createElement('button');
      const ans     = state.answers[q.id];
      const flagged = state.flagged.has(q.id);
      let cls = 'tsa--dot';
      if (i === state.activeQIdx)               cls += ' active';
      else if (flagged)                         cls += ' flagged';
      else if (ans === 'skipped')               cls += ' skipped';
      else if (ans !== undefined && ans !== null) cls += ' answered';
      dot.className = cls;
      dot.setAttribute('type', 'button');
      dot.setAttribute('aria-label', `Question ${i + 1}`);
      dot.addEventListener('click', () => {
        state.activeQIdx = i;
        renderQuestions();
      });
      dom.qDots.appendChild(dot);
    });
  }

  function renderQuestionCard() {
    const q         = activeQuestion();
    const cat       = CATEGORIES[state.activeCatIdx];
    const qs        = activeQuestions();
    const isFlagged = state.flagged.has(q.id);
    const curAns    = state.answers[q.id] !== undefined ? state.answers[q.id] : null;

    const typeLabel = TYPE_LABELS[q.type] || '';
    dom.qCatBadge.innerHTML  = `${escHtml(cat.label)}<span class="tsa--q-type-tag">${escHtml(typeLabel)}</span>`;
    dom.qCounter.textContent = `Question ${state.activeQIdx + 1} of ${qs.length}`;
    dom.qText.textContent    = q.text;

    if (dom.qFlagIndicator) dom.qFlagIndicator.hidden = !isFlagged;
    if (dom.btnFlagLabel)   dom.btnFlagLabel.textContent = isFlagged ? 'Flagged' : 'Flag';
    if (dom.btnFlag) {
      dom.btnFlag.classList.toggle('active', isFlagged);
      dom.btnFlag.setAttribute('aria-pressed', isFlagged ? 'true' : 'false');
    }

    dom.btnPrev.disabled = state.activeQIdx === 0 && state.activeCatIdx === 0;

    const isLastQ   = state.activeQIdx === qs.length - 1;
    const isLastCat = state.activeCatIdx === CATEGORIES.length - 1;

    if (state.reviewOnlyFlagged) {
      const next = nextFlaggedPosition();
      dom.btnNext.innerHTML = next === null
        ? 'Back to Summary <img src="assets/svg/arrow-right.svg" alt="" width="13" height="13" />'
        : 'Next Flagged <img src="assets/svg/arrow-right.svg" alt="" width="13" height="13" />';
    } else {
      dom.btnNext.innerHTML = (isLastQ && isLastCat)
        ? 'Review &amp; Submit <img src="assets/svg/arrow-right.svg" alt="" width="13" height="13" />'
        : 'Next <img src="assets/svg/arrow-right.svg" alt="" width="13" height="13" />';
    }

    renderOptions(q, curAns);
  }


  function renderOptions(q, curAns) {
    dom.optionsList.innerHTML = '';
    if (q.type === 'truefalse') {
      renderTrueFalseOptions(q, curAns);
    } else if (q.type === 'choice') {
      renderChoiceOptions(q, curAns);
    } else if (q.type === 'freq') {
      renderScaleOptions(q, FREQ_SCALE, curAns);
    } else {
      renderScaleOptions(q, LIKERT_SCALE, curAns);
    }
  }

  /* ---- Likert / Frequency ---- */
  function renderScaleOptions(q, scale, curAns) {
    const LETTERS = ['A', 'B', 'C', 'D', 'E'];
    scale.forEach((opt, i) => {
      const isSelected = curAns === opt.value;
      const btn = document.createElement('button');
      btn.type      = 'button';
      btn.className = `tsa--option${isSelected ? ' selected' : ''}`;
      btn.dataset.value = String(opt.value);
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      btn.innerHTML = `
        <span class="tsa--option-marker">${LETTERS[i]}</span>
        <span class="tsa--option-dot" style="background:${opt.color}"></span>
        <span>${escHtml(opt.label)}</span>
      `;
      btn.addEventListener('click', () => handleAnswer(q, opt.value));
      dom.optionsList.appendChild(btn);
    });
  }

  /* ---- Scenario / Multiple Choice (shuffled) ---- */
  function renderChoiceOptions(q, curAns) {
    const shuffled = shuffle(q.options);
    const LETTERS  = ['A', 'B', 'C', 'D'];
    shuffled.forEach((opt, i) => {
      const score      = choiceToScore(opt.score);
      const isSelected = curAns !== null && curAns !== 'skipped' &&
                         Math.abs(curAns - score) < 0.01;
      const btn = document.createElement('button');
      btn.type      = 'button';
      btn.className = `tsa--option tsa--option-choice${isSelected ? ' selected' : ''}`;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      btn.innerHTML = `
        <span class="tsa--option-marker">${LETTERS[i]}</span>
        <span class="tsa--option-choice-text">${escHtml(opt.label)}</span>
      `;
      btn.addEventListener('click', () => handleAnswer(q, score));
      dom.optionsList.appendChild(btn);
    });
  }

  /* ---- True / False ---- */
  function renderTrueFalseOptions(q, curAns) {
    const pressedKey = (state.answeredKey || {})[q.id] || null;
    const TF = [
      { label: 'True',  key: 'true',  value: q.correct === 'true'  ? 5 : 1 },
      { label: 'False', key: 'false', value: q.correct === 'false' ? 5 : 1 },
    ];
    TF.forEach(opt => {
      const isSelected = curAns !== null && curAns !== 'skipped' && pressedKey === opt.key;
      const btn = document.createElement('button');
      btn.type      = 'button';
      btn.className = `tsa--option tsa--option-tf${isSelected ? ' selected' : ''}`;
      btn.dataset.tfkey = opt.key;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      btn.innerHTML = `
        <span class="tsa--tf-icon">${opt.key === 'true' ? '&#10003;' : '&#10007;'}</span>
        <span class="tsa--tf-label">${escHtml(opt.label)}</span>
      `;
      btn.addEventListener('click', () => handleTrueFalseAnswer(q, opt.value, opt.key));
      dom.optionsList.appendChild(btn);
    });
  }

  function handleAnswer(q, value) {
    if (state.locked) return;
    state.locked = true;
    state.answers[q.id] = value;

    dom.optionsList.querySelectorAll('.tsa--option').forEach(btn => {
      const isMatch = parseFloat(btn.dataset.value) === value;
      btn.classList.toggle('selected', isMatch);
      btn.setAttribute('aria-checked', isMatch ? 'true' : 'false');
      btn.disabled = true;
    });

    renderDots();
    renderCatTabs();
    updateCompletionStatus();

    setTimeout(() => { state.locked = false; advanceAuto(); }, 360);
  }

  function handleTrueFalseAnswer(q, value, key) {
    if (state.locked) return;
    state.locked = true;
    state.answers[q.id] = value;
    state.answeredKey[q.id] = key;

    dom.optionsList.querySelectorAll('.tsa--option-tf').forEach(btn => {
      const isMatch = btn.dataset.tfkey === key;
      btn.classList.toggle('selected', isMatch);
      btn.setAttribute('aria-checked', isMatch ? 'true' : 'false');
      btn.disabled = true;
    });

    renderDots();
    renderCatTabs();
    updateCompletionStatus();

    setTimeout(() => { state.locked = false; advanceAuto(); }, 360);
  }

  function updateCompletionStatus() {
    if (!dom.completionStatus) return;
    if (allCatsMeetThreshold()) {
      dom.completionStatus.textContent = '✓ Ready to submit — 50%+ answered in each category';
      dom.completionStatus.classList.add('ready');
    } else {
      dom.completionStatus.textContent = `Need 50%+ per category. Short: ${shortfallMessage()}`;
      dom.completionStatus.classList.remove('ready');
    }
  }

  /* ===========================================================
     FLAG SYSTEM
  =========================================================== */

  function toggleFlag(qid) {
    if (state.flagged.has(qid)) {
      state.flagged.delete(qid);
      showToast('Flag removed', 'info');
    } else {
      state.flagged.add(qid);
      showToast('Question flagged for review', 'info');
    }
    renderQuestionCard();
    renderDots();
  }

  function nextFlaggedPosition() {
    for (let ci = state.activeCatIdx; ci < CATEGORIES.length; ci++) {
      const qs     = questionsForCat(ci);
      const startI = ci === state.activeCatIdx ? state.activeQIdx + 1 : 0;
      for (let qi = startI; qi < qs.length; qi++) {
        if (state.flagged.has(qs[qi].id)) return { catIdx: ci, qIdx: qi };
      }
    }
    return null;
  }

  function prevFlaggedPosition() {
    for (let ci = state.activeCatIdx; ci >= 0; ci--) {
      const qs     = questionsForCat(ci);
      const startI = ci === state.activeCatIdx ? state.activeQIdx - 1 : qs.length - 1;
      for (let qi = startI; qi >= 0; qi--) {
        if (state.flagged.has(qs[qi].id)) return { catIdx: ci, qIdx: qi };
      }
    }
    return null;
  }

  function jumpToFirstFlagged() {
    for (let ci = 0; ci < CATEGORIES.length; ci++) {
      const qs = questionsForCat(ci);
      for (let qi = 0; qi < qs.length; qi++) {
        if (state.flagged.has(qs[qi].id)) {
          state.activeCatIdx = ci;
          state.activeQIdx   = qi;
          return true;
        }
      }
    }
    return false;
  }

  function advanceAuto() {
    const qs      = activeQuestions();
    const isLastQ = state.activeQIdx === qs.length - 1;
    const isLastCat = state.activeCatIdx === CATEGORIES.length - 1;

    if (state.reviewOnlyFlagged) {
      const next = nextFlaggedPosition();
      if (next) {
        state.activeCatIdx = next.catIdx;
        state.activeQIdx   = next.qIdx;
        renderQuestions();
      } else {
        state.reviewOnlyFlagged = false;
        renderReview();
      }
      return;
    }

    if (!isLastQ) {
      state.activeQIdx++;
      renderQuestions();
    } else if (!isLastCat) {
      state.activeCatIdx++;
      state.activeQIdx = 0;
      renderQuestions();
      showToast(`Moving to ${CATEGORIES[state.activeCatIdx].label} Thinking`, 'info');
    } else {
      renderReview();
    }
  }

  function handlePrev() {
    if (state.reviewOnlyFlagged) {
      const prev = prevFlaggedPosition();
      if (prev) {
        state.activeCatIdx = prev.catIdx;
        state.activeQIdx   = prev.qIdx;
        renderQuestions();
      }
      return;
    }
    if (state.activeQIdx > 0) {
      state.activeQIdx--;
    } else if (state.activeCatIdx > 0) {
      state.activeCatIdx--;
      state.activeQIdx = questionsForCat(state.activeCatIdx).length - 1;
    }
    renderQuestions();
  }

  function handleNext() {
    const qs      = activeQuestions();
    const isLastQ = state.activeQIdx === qs.length - 1;
    const isLastCat = state.activeCatIdx === CATEGORIES.length - 1;

    if (state.reviewOnlyFlagged) { advanceAuto(); return; }

    if (isLastQ && isLastCat) {
      if (!allCatsMeetThreshold()) {
        showToast(`Answer at least 50% per category. Short: ${shortfallMessage()}`, 'warning');
        return;
      }
      renderReview();
    } else {
      advanceAuto();
    }
  }

  function handleSkip() {
    const q = activeQuestion();
    if (!q) return;
    state.answers[q.id] = 'skipped';
    renderDots();
    renderCatTabs();
    updateCompletionStatus();
    advanceAuto();
  }

  /* ===========================================================
     RENDER: REVIEW
  =========================================================== */

  function renderReview() {
    state.reviewOnlyFlagged = false;

    const answered   = answeredCount();
    const skipped    = skippedCount();
    const unanswered = unansweredCount();
    const flagCount  = state.flagged.size;

    dom.reviewStats.innerHTML = `
      <div class="tsa--rev-stat-card">
        <span class="tsa--rev-stat-num color-ok">${answered}</span>
        <span class="tsa--rev-stat-label">Answered</span>
      </div>
      <div class="tsa--rev-stat-card">
        <span class="tsa--rev-stat-num color-skip">${skipped}</span>
        <span class="tsa--rev-stat-label">Skipped</span>
      </div>
      <div class="tsa--rev-stat-card">
        <span class="tsa--rev-stat-num color-unanswered">${unanswered}</span>
        <span class="tsa--rev-stat-label">Unanswered</span>
      </div>
      <div class="tsa--rev-stat-card">
        <span class="tsa--rev-stat-num color-flag">${flagCount}</span>
        <span class="tsa--rev-stat-label">Flagged</span>
      </div>
    `;

    dom.reviewCatsGrid.innerHTML = '';
    CATEGORIES.forEach((cat, i) => {
      const qs          = questionsForCat(i);
      const ans         = catAnsweredCount(i);
      const skip        = qs.filter(q => state.answers[q.id] === 'skipped').length;
      const unansweredC = qs.length - ans - skip;
      const item = document.createElement('div');
      item.className = 'tsa--rev-cat-item';
      item.innerHTML = `
        <div class="tsa--rev-cat-name">${escHtml(cat.label)}</div>
        <div class="tsa--rev-cat-badges">
          <span class="tsa--rev-badge ok">${ans} Answered</span>
          <span class="tsa--rev-badge skipped">${skip} Skipped</span>
          <span class="tsa--rev-badge unanswered">${unansweredC} Unanswered</span>
        </div>
      `;
      dom.reviewCatsGrid.appendChild(item);
    });

    if (flagCount > 0) {
      dom.reviewFlaggedBlock.hidden = false;
      dom.reviewFlaggedList.innerHTML = '';
      state.questions.forEach(q => {
        if (!state.flagged.has(q.id)) return;
        const cat  = CATEGORIES[q.catIdx];
        const item = document.createElement('div');
        item.className = 'tsa--flagged-item';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.innerHTML = `
          <div class="tsa--flagged-item-dot"></div>
          <div>
            <div class="tsa--flagged-item-meta">${escHtml(cat.label)} Thinking · ${escHtml(TYPE_LABELS[q.type] || '')}</div>
            <div class="tsa--flagged-item-text">${escHtml(q.text)}</div>
          </div>
        `;
        const jumpTo = () => {
          state.activeCatIdx = q.catIdx;
          state.activeQIdx   = questionsForCat(q.catIdx).indexOf(q);
          state.reviewOnlyFlagged = false;
          renderQuestions();
        };
        item.addEventListener('click', jumpTo);
        item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jumpTo(); } });
        dom.reviewFlaggedList.appendChild(item);
      });
    } else {
      dom.reviewFlaggedBlock.hidden = true;
    }

    dom.revBtnFlagged.disabled = flagCount === 0;
    showScreen('screenReview');
  }

  /* ===========================================================
     RENDER: RESULTS
  =========================================================== */

  function renderResults() {
    showLoader();
    setTimeout(() => {
      try {
        const scores   = allScores();
        const overall  = overallPct();
        const dom_type = dominantType();
        const dateStr  = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

        dom.resMeta.textContent       = `${state.userName} · ${dateStr}`;
        dom.resCircle.style.setProperty('--pct', overall);
        dom.resOverallPct.textContent  = overall + '%';
        dom.resOverallType.textContent = dom_type ? INSIGHTS[dom_type.cat.id].type : '—';

        renderScoreBars(scores);
        renderInsight(dom_type);
        renderDetailCards(dom_type);
        showScreen('screenResults');
      } finally {
        hideLoader();
      }
    }, 400);
  }

  function renderScoreBars(scores) {
    const section = dom.scoreBarsSection;
    section.innerHTML = '<p class="tsa--score-bars-title">Category Scores</p>';
    scores.forEach(({ cat, score }) => {
      const pct       = score !== null ? score : 0;
      const typeLabel = INSIGHTS[cat.id] ? INSIGHTS[cat.id].type : cat.label;
      const item = document.createElement('div');
      item.className = 'tsa--score-bar-item';
      item.innerHTML = `
        <div class="tsa--score-bar-meta">
          <span class="tsa--score-bar-name">${escHtml(cat.label)} Thinking</span>
          <span class="tsa--score-bar-pct">${score !== null ? score + '%' : '—'}</span>
        </div>
        <div class="tsa--score-bar-track">
          <div class="tsa--score-bar-fill" data-type="${escHtml(typeLabel)}" style="width:0%" data-pct="${pct}"></div>
        </div>
      `;
      section.appendChild(item);
    });
    requestAnimationFrame(() => {
      section.querySelectorAll('.tsa--score-bar-fill').forEach(fill => {
        fill.style.width = fill.dataset.pct + '%';
      });
    });
  }

  function renderInsight(dominant) {
    if (!dominant) { dom.resInsight.textContent = ''; return; }
    dom.resInsight.textContent = INSIGHTS[dominant.cat.id].insight;
  }

  function renderDetailCards(dominant) {
    dom.resDetailGrid.innerHTML = '';
    if (!dominant) return;
    const info  = INSIGHTS[dominant.cat.id];
    const cards = [
      { title: 'Core Strengths', items: info.strengths },
      { title: 'Growth Edges',   items: info.growth    },
      { title: 'Aligned Roles',  items: info.roles     },
    ];
    cards.forEach(card => {
      const el = document.createElement('div');
      el.className = 'tsa--res-detail-card';
      el.innerHTML = `
        <p class="tsa--res-detail-card-title">${escHtml(card.title)}</p>
        <ul class="tsa--res-list">
          ${card.items.map(item => `<li>${escHtml(item)}</li>`).join('')}
        </ul>
      `;
      dom.resDetailGrid.appendChild(el);
    });
  }

  /* ===========================================================
     PDF EXPORT
  =========================================================== */

  function exportPDF() {
    const btn = dom.btnPdf;
    if (btn.disabled) return;
    btn.disabled    = true;
    btn.textContent = 'Generating…';
    showLoader();

    setTimeout(() => {
      try {
        if (typeof window.jspdf === 'undefined') {
          showToast('PDF library not loaded. Please refresh and try again.', 'error');
          return;
        }

        const { jsPDF } = window.jspdf;
        const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const PW   = doc.internal.pageSize.getWidth();
        const PH   = doc.internal.pageSize.getHeight();
        const ML   = 18, MR = 18, CW = PW - ML - MR;
        let   y    = 0;

        function newPage() { doc.addPage(); y = 18; }
        function checkPage(need = 20) { if (y + need > PH - 14) newPage(); }

        function hexRgb(hex) {
          const h = hex.replace('#', '');
          return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
        }

        function bar(x, by, w, h, pct, color) {
          doc.setFillColor(220, 220, 218);
          doc.roundedRect(x, by, w, h, 1, 1, 'F');
          if (pct > 0) {
            doc.setFillColor(...hexRgb(color));
            doc.roundedRect(x, by, w * pct / 100, h, 1, 1, 'F');
          }
        }

        const scores   = allScores();
        const overall  = overallPct();
        const dominant = dominantType();
        const dateStr  = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

        /* COVER */
        doc.setFillColor(17, 17, 16); doc.rect(0, 0, PW, 52, 'F');
        doc.setFillColor(255, 198, 47); doc.rect(0, 50, PW, 2.5, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(255, 255, 255);
        doc.text('Thinking Style Assessment', PW / 2, 20, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(180, 180, 180);
        doc.text('Psychometric Cognitive Evaluation Report', PW / 2, 31, { align: 'center' });
        doc.setFontSize(9); doc.setTextColor(255, 198, 47);
        doc.text('EasyShiksha Internal Tool', PW / 2, 41, { align: 'center' });

        y = 64;
        [['Name:', state.userName], ['Date:', dateStr], ['Mode:', state.mode.label + ' (' + state.mode.detail + ')']].forEach(([lbl, val]) => {
          doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100);
          doc.text(lbl, ML, y);
          doc.setFont('helvetica', 'bold'); doc.setTextColor(17, 17, 16);
          doc.text(String(val), ML + 28, y);
          y += 8;
        });

        /* Overall circle */
        y += 4;
        const cx = PW / 2, cy = y + 22;
        doc.setFillColor(255, 198, 47); doc.circle(cx, cy, 22, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(26); doc.setTextColor(17, 17, 16);
        doc.text(overall + '%', cx, cy + 4, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80);
        doc.text('Overall Score', cx, cy + 14, { align: 'center' });
        if (dominant) {
          const info = INSIGHTS[dominant.cat.id];
          const [r, g, b] = hexRgb(dominant.cat.color);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(r, g, b);
          doc.text(info.type, cx, cy + 24, { align: 'center' });
        }
        y = cy + 36;

        /* Score bars */
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(17, 17, 16);
        doc.text('Category Scores', ML, y); y += 10;
        scores.forEach(({ cat, score }) => {
          checkPage(22);
          const pct = score !== null ? score : 0;
          const [r, g, b] = hexRgb(cat.color);
          doc.setFillColor(248, 248, 246);
          doc.roundedRect(ML, y - 5, CW, 17, 2, 2, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(17, 17, 16);
          doc.text(cat.label + ' Thinking', ML + 3, y + 3);
          bar(ML + 72, y - 2, 70, 5, pct, cat.color);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(r, g, b);
          doc.text(score !== null ? score + '%' : '—', PW - MR - 2, y + 4, { align: 'right' });
          y += 21;
        });

        /* Insight page */
        if (dominant) {
          newPage();
          const info = INSIGHTS[dominant.cat.id];
          doc.setFillColor(17, 17, 16);
          doc.rect(ML, y, CW, 10, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 198, 47);
          doc.text('YOUR THINKING PROFILE', ML + 4, y + 7);
          y += 16;

          const lines = doc.splitTextToSize(info.insight, CW);
          doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(40, 40, 40);
          doc.text(lines, ML, y);
          y += lines.length * 6 + 10;

          [
            { title: 'CORE STRENGTHS', items: info.strengths, bg: [240, 253, 244], tc: [22, 101, 52] },
            { title: 'GROWTH EDGES',   items: info.growth,    bg: [254, 252, 232], tc: [133, 77, 14] },
          ].forEach(panel => {
            checkPage(panel.items.length * 8 + 20);
            doc.setFillColor(...panel.bg);
            const h = panel.items.length * 8 + 16;
            doc.roundedRect(ML, y, CW, h, 3, 3, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...panel.tc);
            doc.text(panel.title, ML + 5, y + 8);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(40, 40, 40);
            panel.items.forEach((item, i) => { doc.text('• ' + item, ML + 5, y + 17 + i * 8); });
            y += h + 8;
          });

          checkPage(30);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(17, 17, 16);
          doc.text('Aligned Career Roles', ML, y); y += 8;
          info.roles.forEach(role => {
            checkPage(10);
            const [r, g, b] = hexRgb(dominant.cat.color);
            doc.setFillColor(r, g, b, 0.1);
            doc.roundedRect(ML, y - 4, CW, 9, 2, 2, 'F');
            doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(17, 17, 16);
            doc.text('• ' + role, ML + 4, y + 2);
            y += 11;
          });
        }

        /* Response log */
        newPage();
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(17, 17, 16);
        doc.text('Response Log', ML, y); y += 10;
        doc.setFillColor(255, 198, 47); doc.rect(ML, y, CW, 1.5, 'F'); y += 8;

        CATEGORIES.forEach(cat => {
          checkPage(18);
          doc.setFillColor(17, 17, 16);
          doc.roundedRect(ML, y - 5, CW, 12, 2, 2, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
          doc.text(cat.label + ' Thinking', ML + 4, y + 3);
          y += 14;

          questionsForCat(CATEGORIES.indexOf(cat)).forEach((q, qi) => {
            const ans      = state.answers[q.id];
            const label    = answerLabel(q, ans);
            const isGood   = ans !== undefined && ans !== null && ans !== 'skipped';
            const [r, g, b] = isGood ? hexRgb(cat.color) : [150, 150, 150];
            const typeTag  = TYPE_LABELS[q.type] || '';
            const txtLines = doc.splitTextToSize(`${qi + 1}. [${typeTag}] ${q.text}`, CW - 6);
            checkPage(txtLines.length * 5 + 14);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(40, 40, 40);
            doc.text(txtLines, ML + 2, y);
            y += txtLines.length * 5 + 1;
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(r, g, b);
            doc.text('→ ' + label, ML + 6, y);
            y += 9;
          });
          y += 4;
        });

        /* Page numbers */
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(160);
          doc.text(`Page ${i} of ${pageCount}`, ML, PH - 7);
          doc.text('EasyShiksha · Thinking Style Assessment', PW - MR, PH - 7, { align: 'right' });
        }

        const fileName = `TSA_${state.userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        showToast('PDF exported successfully!', 'success');

      } catch (err) {
        showToast('PDF generation failed. Please try again.', 'error');
      } finally {
        setTimeout(() => {
          hideLoader();
          btn.disabled = false;
          btn.innerHTML = '<img src="assets/svg/download.svg" alt="" width="13" height="13" /> Export PDF';
        }, 600);
      }
    }, 200);
  }

  function saveSession() {
    try {
      const payload = JSON.stringify({
        version: 2,
        data: {
          userName: state.userName,
          mode: state.mode.id,
          questions: state.questions,
          answers: state.answers,
          answeredKey: state.answeredKey || {},
          flagged: Array.from(state.flagged),
        },
        settings: {},
      });
      localStorage.setItem(STORAGE_KEY, payload);
    } catch (_) { }
  }

  function restart() {
    showConfirm('Start New Assessment?', 'All current progress will be lost. This cannot be undone.').then(confirmed => {
      if (!confirmed) return;
      state = buildInitialState();
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) { }
      dom.inpName.value = '';
      dom.errName.textContent = '';
      renderWelcome();
    });
  }

  function bindEvents() {
    dom.welcomeForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = dom.inpName.value.trim();
      dom.errName.textContent = '';
      dom.inpName.classList.remove('tsa--input-err');

      let ok = true;
      if (!name || name.length < 2) {
        dom.errName.textContent = 'Please enter your full name (at least 2 characters).';
        dom.inpName.classList.add('tsa--input-err');
        ok = false;
      }
      if (!ok) { dom.inpName.focus(); return; }

      const selectedMode = dom.modeGrid.querySelector('input[name="assessmentMode"]:checked');
      const modeId = selectedMode ? selectedMode.value : 'full';
      state.mode       = ASSESSMENT_MODES.find(m => m.id === modeId) || ASSESSMENT_MODES[0];
      state.userName   = name;
      state.questions  = buildQuestions(state.mode);
      state.answers    = {};
      state.answeredKey = {};
      state.flagged    = new Set();
      state.activeCatIdx = 0;
      state.activeQIdx   = 0;
      state.locked       = false;

      saveSession();
      renderQuestions();
    });

    dom.inpName.addEventListener('input', () => {
      if (dom.inpName.value.trim().length >= 2) {
        dom.errName.textContent = '';
        dom.inpName.classList.remove('tsa--input-err');
      }
    });

    dom.inpName.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); dom.welcomeForm.dispatchEvent(new Event('submit')); }
    });

    dom.btnPrev.addEventListener('click', handlePrev);
    dom.btnNext.addEventListener('click', handleNext);
    dom.btnSkip.addEventListener('click', handleSkip);

    dom.btnFlag.addEventListener('click', () => {
      const q = activeQuestion();
      if (q) toggleFlag(q.id);
    });

    dom.btnViewResults.addEventListener('click', () => {
      if (!allCatsMeetThreshold()) {
        showToast(`Answer at least 50% per category. Short: ${shortfallMessage()}`, 'warning');
        return;
      }
      renderReview();
    });

    dom.revBtnBack.addEventListener('click', () => {
      state.activeCatIdx = 0;
      state.activeQIdx   = 0;
      renderQuestions();
    });

    dom.revBtnFlagged.addEventListener('click', () => {
      if (state.flagged.size === 0) {
        showToast('No flagged questions to review.', 'info');
        return;
      }
      state.reviewOnlyFlagged = true;
      if (!jumpToFirstFlagged()) {
        state.reviewOnlyFlagged = false;
        showToast('No flagged questions found.', 'info');
        return;
      }
      renderQuestions();
    });

    dom.revBtnSubmit.addEventListener('click', () => {
      if (!allCatsMeetThreshold()) {
        showToast(`Cannot submit. Need 50%+ in every category. Short: ${shortfallMessage()}`, 'error');
        return;
      }
      saveSession();
      renderResults();
    });

    dom.btnRestart.addEventListener('click', restart);
    dom.btnPdf.addEventListener('click', exportPDF);

    dom.confirmOk.addEventListener('click', () => {
      dom.confirmOverlay.hidden = true;
      if (confirmResolve) { confirmResolve(true); confirmResolve = null; }
    });

    dom.confirmCancel.addEventListener('click', () => {
      dom.confirmOverlay.hidden = true;
      if (confirmResolve) { confirmResolve(false); confirmResolve = null; }
    });

    dom.confirmOverlay.addEventListener('click', e => {
      if (e.target === dom.confirmOverlay) {
        dom.confirmOverlay.hidden = true;
        if (confirmResolve) { confirmResolve(false); confirmResolve = null; }
      }
    });

    document.addEventListener('keydown', e => {
      if (!dom.confirmOverlay.hidden) {
        if (e.key === 'Escape') {
          dom.confirmOverlay.hidden = true;
          if (confirmResolve) { confirmResolve(false); confirmResolve = null; }
        }
        if (e.key === 'Enter') {
          dom.confirmOverlay.hidden = true;
          if (confirmResolve) { confirmResolve(true); confirmResolve = null; }
        }
      }
    });
  }

  function init() {
    cacheDOM();
    bindEvents();
    showLoader();
    setTimeout(() => {
      hideLoader();
      renderWelcome();
    }, 600);
  }

  document.addEventListener('DOMContentLoaded', init);

})();