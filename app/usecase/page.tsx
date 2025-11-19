import { Metadata } from 'next'
import {
  Users,
  Student,
  ChalkboardTeacher,
} from '@phosphor-icons/react/dist/ssr'

export const metadata: Metadata = {
  title: 'Use Case Diagram',
  description:
    'Basic use case view showing Student, Teacher, and Registrar interactions across the Marian College portal.',
}

const monoFont = "Monaco, 'Courier New', Courier, monospace"

const ACTOR_BOX = {
  width: 110,
  height: 45,
  offsetX: 10,
  offsetY: 5,
}

const USE_CASE_BOX = {
  width: 150,
  height: 46,
  offsetX: 10,
  offsetY: 6,
  chipOffsetX: 18,
  chipOffsetY: 22,
  chipSize: 14,
}

const actorNodes = [
  { id: 'student', label: 'Student', x: 50, y: 50, color: '#15803d' },
  { id: 'teacher', label: 'Teacher', x: 50, y: 150, color: '#0f766e' },
  { id: 'registrar', label: 'Registrar', x: 50, y: 250, color: '#1e3a8a' },
]

const useCaseNodes = [
  {
    id: 'profile',
    label: 'Account & Profile Setup',
    x: 250,
    y: 10,
    color: '#0f172a',
  },
  {
    id: 'enrollment',
    label: 'Enrollment Intake',
    x: 250,
    y: 70,
    color: '#1d3461',
  },
  {
    id: 'documents',
    label: 'Document Compliance',
    x: 250,
    y: 130,
    color: '#1d4ed8',
  },
  {
    id: 'grades',
    label: 'Grades & Sectioning',
    x: 250,
    y: 190,
    color: '#1e40af',
  },
  {
    id: 'events',
    label: 'Events & Notifications',
    x: 250,
    y: 250,
    color: '#1e3a8a',
  },
  {
    id: 'reports',
    label: 'Reports & Audit Trail',
    x: 250,
    y: 310,
    color: '#2a4365',
  },
  {
    id: 'config',
    label: 'System Configuration',
    x: 250,
    y: 370,
    color: '#324a79',
  },
]

const links: Array<{ from: string; to: string }> = [
  { from: 'student', to: 'profile' },
  { from: 'student', to: 'enrollment' },
  { from: 'student', to: 'documents' },
  { from: 'student', to: 'grades' },
  { from: 'student', to: 'events' },
  { from: 'student', to: 'reports' },
  { from: 'teacher', to: 'profile' },
  { from: 'teacher', to: 'grades' },
  { from: 'teacher', to: 'events' },
  { from: 'teacher', to: 'reports' },
  { from: 'registrar', to: 'profile' },
  { from: 'registrar', to: 'enrollment' },
  { from: 'registrar', to: 'documents' },
  { from: 'registrar', to: 'grades' },
  { from: 'registrar', to: 'events' },
  { from: 'registrar', to: 'reports' },
  { from: 'registrar', to: 'config' },
]

const getNode = (id: string) =>
  actorNodes.concat(useCaseNodes).find((node) => node.id === id)

const roles = [
  {
    id: 'student',
    icon: Student,
    title: 'Student',
    responsibilities: [
      'Submit enrollment data and documents',
      'Track grades, schedules, and scholarships',
      'Receive announcements and calendar events',
    ],
  },
  {
    id: 'teacher',
    icon: ChalkboardTeacher,
    title: 'Teacher',
    responsibilities: [
      'Manage class rosters and sections',
      'Encode grading period scores and remarks',
      'Share relevant announcements with students',
    ],
  },
  {
    id: 'registrar',
    icon: Users,
    title: 'Registrar',
    responsibilities: [
      'Approve enrollments and verify documents',
      'Configure courses, sections, and subject sets',
      'Publish events, reports, and AI-ready datasets',
    ],
  },
]

const useCaseInventory = [
  {
    title: 'Account & Profile Setup',
    description:
      'Create accounts, capture demographics, roles, and security preferences aligned with onboarding steps.',
    actors: ['Student', 'Teacher', 'Registrar'],
    keyApis: ['/api/auth/login', '/api/user/profile'],
  },
  {
    title: 'Enrollment Intake',
    description:
      'Collect program choices, strands, and course loads; registrars approve and assign official IDs.',
    actors: ['Student', 'Registrar'],
    keyApis: ['/api/enrollment', '/api/sections'],
  },
  {
    title: 'Document Compliance',
    description:
      'Upload birth certificates, report cards, and medical files, then route them through verification.',
    actors: ['Student', 'Registrar'],
    keyApis: ['/api/documents/upload', '/api/documents/{id}/verify'],
  },
  {
    title: 'Grades & Sectioning',
    description:
      'Teachers encode period grades, registrars finalize sections, and students view real-time outcomes.',
    actors: ['Student', 'Teacher', 'Registrar'],
    keyApis: ['/api/grades-data', '/api/sections'],
  },
  {
    title: 'Events & Notifications',
    description:
      'Registrar-managed announcements surface on dashboards; students and teachers receive targeted feeds.',
    actors: ['Student', 'Teacher', 'Registrar'],
    keyApis: ['/api/events'],
  },
  {
    title: 'Reports & Audit Trail',
    description:
      'Every sensitive mutation is logged for compliance, enabling printable or exportable audit views.',
    actors: ['Teacher', 'Registrar'],
    keyApis: ['/api/ai/student-data', '/api/ai/enrollment-data'],
  },
  {
    title: 'System Configuration',
    description:
      'Registrar-only controls for AY codes, scholarship formulas, and feature flags keep logic centralized.',
    actors: ['Registrar'],
    keyApis: ['/api/system-config', '/api/scholarships'],
  },
]

const scenarioDeck = [
  {
    name: 'Enrollment Approval Loop',
    steps: [
      'Student submits intake form with strand or course selections.',
      'Registrar validates requirements, assigns section, then toggles status to approved.',
      'Student receives toast confirmation and can now view schedule drafts.',
    ],
  },
  {
    name: 'Grade Publishing Flow',
    steps: [
      'Teacher encodes grading periods per subject set.',
      'Registrar audits submissions, then releases results to students.',
      'Students see updates instantly and download reports from `/api/grades-data` consumers.',
    ],
  },
  {
    name: 'Document Remediation',
    steps: [
      'Student uploads a missing requirement; file lands in secure storage.',
      'Registrar reviews metadata, verifies authenticity, and logs the outcome.',
      'If rejected, the system notifies the student with exact remediation notes.',
    ],
  },
  {
    name: 'Event Broadcasting',
    steps: [
      'Registrar crafts an event targeted to SHS or College cohorts.',
      'Teachers optionally pin key events inside their classroom spaces.',
      'Students receive synchronized reminders across dashboard and calendar.',
    ],
  },
]

const UseCasePage = () => {
  return (
    <main
      className="min-h-screen bg-white text-blue-900"
      aria-label="Use case diagram for Student, Teacher, and Registrar roles"
      style={{ fontFamily: monoFont, fontSize: '0.92rem' }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
        <header className="rounded-xl border border-blue-900/20 bg-white px-5 py-5 shadow-sm">
          <p className="text-xs tracking-wide">System Overview</p>
          <h1 className="mt-2 text-2xl">Student Portal Use Case Diagram</h1>
          <p className="mt-3 text-sm leading-relaxed">
            The diagram below highlights how Students, Teachers, and Registrars
            rely on shared platform capabilities. Sensitive workflows,
            validations, and data mutations stay inside dedicated{' '}
            <code className="text-xs">/api</code> routes per architecture rules,
            while this page provides a visual reference for collaboration
            discussions.
          </p>
        </header>

        <section className="rounded-xl border border-blue-900/20 bg-white p-5 shadow-sm">
          <h2 className="text-xl">Diagram</h2>
          <p className="mt-2 text-xs">
            Straight lines connect actors to the platform capabilities they need
            most often.
          </p>
          <div className="mt-6 overflow-x-auto">
            <svg
              role="img"
              aria-label="Use case connections"
              viewBox="0 0 520 430"
              className="h-auto w-full"
            >
              <rect width="100%" height="100%" fill="white" />
              {links.map((link) => {
                const from = getNode(link.from)
                const to = getNode(link.to)
                const actorColor =
                  actorNodes.find((actor) => actor.id === link.from)?.color ??
                  '#1e3a8a'

                if (!from || !to) {
                  return null
                }

                const fromX = from.x + ACTOR_BOX.offsetX + ACTOR_BOX.width
                const fromY = from.y + ACTOR_BOX.offsetY + ACTOR_BOX.height / 2
                const toX = to.x + USE_CASE_BOX.offsetX
                const toY =
                  to.y + USE_CASE_BOX.offsetY + USE_CASE_BOX.height / 2

                return (
                  <line
                    key={`${link.from}-${link.to}`}
                    x1={fromX}
                    y1={fromY}
                    x2={toX}
                    y2={toY}
                    stroke={actorColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                )
              })}

              {actorNodes.map((actor) => (
                <g key={actor.id}>
                  <rect
                    x={actor.x + ACTOR_BOX.offsetX}
                    y={actor.y + ACTOR_BOX.offsetY}
                    width={ACTOR_BOX.width}
                    height={ACTOR_BOX.height}
                    fill="white"
                    stroke={actor.color}
                    strokeWidth="1.5"
                  />
                  <text
                    x={actor.x + ACTOR_BOX.offsetX + ACTOR_BOX.width / 2 + 5}
                    y={actor.y + ACTOR_BOX.offsetY + ACTOR_BOX.height / 2 + 5}
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily={monoFont}
                    fill={actor.color}
                  >
                    {actor.label}
                  </text>
                </g>
              ))}

              {useCaseNodes.map((uc) => (
                <g key={uc.id}>
                  <rect
                    x={uc.x + USE_CASE_BOX.offsetX}
                    y={uc.y + USE_CASE_BOX.offsetY}
                    width={USE_CASE_BOX.width}
                    height={USE_CASE_BOX.height}
                    rx="12"
                    ry="12"
                    fill={uc.color}
                    opacity="0.12"
                    stroke={uc.color}
                    strokeWidth="2"
                  />
                  <rect
                    x={uc.x + USE_CASE_BOX.chipOffsetX}
                    y={uc.y + USE_CASE_BOX.chipOffsetY}
                    width={USE_CASE_BOX.chipSize}
                    height={USE_CASE_BOX.chipSize}
                    rx="3"
                    ry="3"
                    fill={uc.color}
                    aria-hidden="true"
                  />
                  <text
                    x={uc.x + USE_CASE_BOX.offsetX + USE_CASE_BOX.width / 1.6}
                    y={
                      uc.y + USE_CASE_BOX.offsetY + USE_CASE_BOX.height / 2 + 2
                    }
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily={monoFont}
                    fill="#0f172a"
                  >
                    {uc.label}
                  </text>
                </g>
              ))}
            </svg>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {useCaseNodes.map((node) => (
                <div
                  key={`legend-${node.id}`}
                  className="flex items-center gap-2 text-xs"
                >
                  <span
                    className="h-4 w-4 rounded-sm"
                    style={{ backgroundColor: node.color }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-[10px]"
                    style={{
                      fontFamily: monoFont,
                    }}
                  >
                    {node.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-blue-900/20 bg-white p-5 shadow-sm">
          <h2 className="text-xl">Role Breakdown</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {roles.map((role) => {
              const Icon = role.icon
              return (
                <article
                  key={role.id}
                  className="rounded-xl border border-blue-900/20 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-900/20 bg-white"
                    >
                      <Icon size={18} weight="fill" className="text-blue-900" />
                    </span>
                    <h3 className="text-base">{role.title}</h3>
                  </div>
                  <ul className="mt-3 space-y-2 text-xs">
                    {role.responsibilities.map((item) => (
                      <li key={item} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              )
            })}
          </div>
        </section>

        <section className="rounded-xl border border-blue-900/20 bg-white p-5 shadow-sm">
          <h2 className="text-xl">Use Case Inventory</h2>
          <p className="mt-2 text-xs">
            Each capability references the documentation in
            `SYSTEM_DOCUMENTATION.md` so future specs stay traceable.
          </p>
          <div className="mt-6 space-y-4">
            {useCaseInventory.map((useCase) => (
              <article
                key={useCase.title}
                className="rounded-xl border border-blue-900/20 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-base">{useCase.title}</h3>
                    <p className="text-xs">{useCase.description}</p>
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold">Actors</p>
                    <p>{useCase.actors.join(', ')}</p>
                  </div>
                </div>
                <p className="mt-2 text-[11px]">
                  API Touchpoints: {useCase.keyApis.join(', ')}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-blue-900/20 bg-white p-5 shadow-sm">
          <h2 className="text-xl">Scenario Deck</h2>
          <p className="mt-2 text-xs">
            These step-by-step narratives help engineers, designers, and QA
            align on expected flows.
          </p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {scenarioDeck.map((scenario) => (
              <article
                key={scenario.name}
                className="rounded-xl border border-blue-900/20 bg-white p-4 shadow-sm"
              >
                <h3 className="text-base">{scenario.name}</h3>
                <ol className="mt-3 space-y-2 text-xs">
                  {scenario.steps.map((step) => (
                    <li key={step} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default UseCasePage
