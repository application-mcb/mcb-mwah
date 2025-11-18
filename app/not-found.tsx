import Link from 'next/link'

const NotFoundPage = () => {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-6">
        <p
          className="text-sm uppercase tracking-[0.3em] text-blue-900/60"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          404 Error
        </p>
        <h1
          className="text-4xl font-medium text-blue-900"
          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
        >
          Marian College page not found
        </h1>
        <p
          className="text-blue-900/80 text-base"
          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
        >
          The resource you are looking for might have been removed, renamed, or
          is temporarily unavailable.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-lg bg-blue-900 text-white px-6 py-3 text-sm transition hover:bg-blue-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900"
            aria-label="Return to Marian College homepage"
          >
            Back to homepage
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-blue-900 text-blue-900 px-6 py-3 text-sm transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900"
            aria-label="Go to Marian College login"
          >
            Go to login
          </Link>
        </div>
      </div>
    </main>
  )
}

export default NotFoundPage
