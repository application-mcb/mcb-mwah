import type { Metadata } from 'next'
import Link from 'next/link'

type SearchTarget = {
  name: string
  description: string
  href: string
  keywords: string[]
}

const searchTargets: SearchTarget[] = [
  {
    name: 'Home',
    description: 'Preview the Marian College digital campus experience.',
    href: '/',
    keywords: ['home', 'landing', 'overview'],
  },
  {
    name: 'Login',
    description: 'Securely access your personalized student dashboard.',
    href: '/login',
    keywords: ['signin', 'student login'],
  },
  {
    name: 'Dashboard',
    description: 'Monitor announcements, tasks, and upcoming events.',
    href: '/dashboard',
    keywords: ['grades', 'tasks', 'announcements'],
  },
  {
    name: 'Teacher Portal',
    description: 'Coordinate classes, subjects, and student progress.',
    href: '/teacher',
    keywords: ['faculty', 'classes', 'teachers'],
  },
]

export const metadata: Metadata = {
  title: 'Search',
  description:
    'Search Marian College of Baliuag portal destinations including landing, login, dashboard, and teacher pages.',
  robots: { index: true, follow: true },
}

type SearchPageProps = {
  searchParams?: {
    q?: string
  }
}

const SearchPage = ({ searchParams }: SearchPageProps) => {
  const query = searchParams?.q?.trim().toLowerCase() ?? ''
  const filteredTargets = query
    ? searchTargets.filter((target) => {
        const haystack = [target.name, target.description, ...target.keywords]
          .join(' ')
          .toLowerCase()
        return haystack.includes(query)
      })
    : searchTargets

  return (
    <section className="min-h-screen bg-white px-6 py-12 text-blue-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-900">
            Marian College of Baliuag
          </p>
          <h1 className="text-3xl font-medium">Search the portal</h1>
          <p className="text-sm text-blue-900/80">
            Locate key areas like login, dashboard, and teacher sections in one
            place.
          </p>
        </header>
        <form
          aria-label="Site search"
          role="search"
          className="flex flex-col gap-4 rounded-xl border border-blue-900/20 bg-white p-6 shadow-sm"
          method="GET"
        >
          <label className="text-sm font-medium" htmlFor="query">
            Search keyword
          </label>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              id="query"
              name="q"
              defaultValue={query}
              placeholder="Try “login” or “registrar”"
              className="w-full rounded-xl border border-blue-900/30 bg-white px-4 py-3 text-blue-900 outline-none transition focus:border-blue-900 focus:ring-2 focus:ring-blue-900/40"
              aria-label="Search keyword"
            />
            <button
              type="submit"
              className="min-w-[140px] rounded-lg bg-blue-900 px-4 py-3 text-white transition hover:bg-blue-900/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900"
              aria-label="Submit search"
            >
              Search
            </button>
          </div>
        </form>
        <div
          aria-live="polite"
          className="rounded-xl border border-blue-900/10 bg-white p-4"
        >
          <p className="text-sm font-medium">
            {filteredTargets.length} matching destination
            {filteredTargets.length === 1 ? '' : 's'}
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {filteredTargets.map((target) => (
              <li
                key={target.href}
                className="rounded-xl border border-blue-900/10 bg-white/80 p-4 transition hover:border-blue-900/40"
              >
                <Link
                  href={target.href}
                  aria-label={`Go to ${target.name}`}
                  className="flex flex-col gap-1"
                  tabIndex={0}
                >
                  <span className="text-lg font-medium">{target.name}</span>
                  <span className="text-sm text-blue-900/80">
                    {target.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default SearchPage
