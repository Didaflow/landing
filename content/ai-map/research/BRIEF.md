# Research brief for the AI Map — rules for every update

Project: an editorial "AI Map" for HIGHER EDUCATION (public and private universities, general and business schools),
published by Didaflow. Users pick a stakeholder → a task → compare AI tools for that task → open a tool analysis with references.
Three stakeholders only: student, teacher, instructional design (programme coordinators, instructional designers, teaching & learning centres).

ACCURACY RULES (non-negotiable)
- Never invent studies, DOIs, URLs, numbers, prices, licences, dates. Every DOI must resolve (check doi.org). If unsure: omit or mark "not verified".
- Record what you actually read: "full" | "abstract" | "page". An abstract alone is not enough for a methodological reading: say so.
- Prefer, in order: systematic reviews / meta-analyses (2023–2026), then primary studies with a comparison group (RCT, quasi-experimental), in higher education (adults). Lower: correlational surveys, single-case reports. Preprints allowed but kind="preprint".
- Vendor-funded or vendor-authored studies are allowed but the conflict of interest must be in "uncertainty".
- Keep outcomes separate: assisted-performance | learning | transfer | retention | satisfaction | time | equity | integrity | wellbeing.
- Do not transfer results across ages/disciplines/products/versions without saying so. School-level (K-12) evidence may be cited only as indirect, flagged.
- If no rigorous evidence exists for a task, say so explicitly: that is a valid, important result.
- OECD Digital Education Outlook 2026 (CC BY 4.0, doi 10.1787/062a7394-en) is a reference and a pointer to primary studies: cite the primary studies themselves after checking them.
- Record the date of every check. Edit only the files in content/ai-map/ and rebuild with `bun run build:map`.
- Bilingual text: every human-readable field is {"en": "...", "it": "..."}. Italian must be natural, plain, non-literal. Short sentences. No jargon without explanation.

DRAFT TASK LIST (ids are stable; you may propose additions with new ids, prefix by role)
student:  s-understand (understand concepts and readings), s-practice (practise and self-test for exams), s-writing (write and get feedback on writing),
          s-coding (learn programming), s-literature (search and synthesise literature), s-argue (prepare discussions, cases, arguments),
          s-stem-problems (solve maths/STEM problems), s-language (study in a second language / language learning),
          s-plan (plan and self-regulate study), s-ideas (generate ideas and creative work), s-groupwork (collaborate in group projects)
teacher:  t-materials (prepare lessons and materials), t-items (create quiz and exam questions), t-feedback (give feedback on student work),
          t-grading (mark and grade), t-assistant (course Q&A assistant / AI teaching assistant), t-detect (detect AI-generated work),
          t-accessibility (make materials accessible, translate), t-case-teaching (teach with cases and discussions),
          t-classroom-feedback (feedback on own teaching, e.g. discourse analytics), t-tutoring (scale tutoring / support)
design:   d-outcomes (define learning outcomes and align curriculum), d-course-design (design or redesign a course),
          d-evaluations (analyse student course-evaluation comments), d-workload (estimate student workload),
          d-analytics (learning analytics, progression and dropout monitoring), d-chatbot (build and configure a course chatbot),
          d-content-scale (produce OER/content at scale), d-quality (programme review and quality assurance)

TOOL TYPES (use these ids when you link tasks to kinds of tools)
general-assistant, research-assistant, writing-feedback, coding-assistant, tutoring-system, item-generator, ai-detector,
lms-integrated, translation, transcription-notes, presentation-generator, analytics, custom-chatbot, local-open-weights, teaching-analytics

EVIDENCE LEVELS: none | indirect | limited | mixed | consistent
 none = no study found on this task in HE; indirect = only other tasks/levels/settings; limited = few direct HE studies, small/short;
 mixed = several direct studies, conflicting; consistent = several direct studies incl. a review, converging.
