import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedSong, setSelectedSong] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const currentRequest = useRef(null)

  useEffect(() => {
    return () => currentRequest.current?.abort()
  }, [])

  async function handleSearch(event) {
    event.preventDefault()

    const searchTerm = query.trim()
    if (!searchTerm) {
      setResults([])
      setError('Enter a song title or artist to search.')
      setStatus('error')
      return
    }

    currentRequest.current?.abort()
    const controller = new AbortController()
    currentRequest.current = controller
    setResults([])
    setSelectedSong(null)
    setError('')
    setStatus('loading')

    try {
      const isIdSearch = /^\d+$/.test(searchTerm)
      const endpoint = isIdSearch
        ? `https://lrclib.net/api/get/${encodeURIComponent(searchTerm)}`
        : `https://lrclib.net/api/search?${new URLSearchParams({ q: searchTerm }).toString()}`
      const response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })

      if (isIdSearch && response.status === 404) {
        setResults([])
        setStatus('success')
        return
      }

      if (!response.ok) {
        throw new Error(`LRCLIB returned an error (${response.status}).`)
      }

      const responseData = await response.json()
      if (
        isIdSearch
          ? !responseData || typeof responseData !== 'object' || Array.isArray(responseData)
          : !Array.isArray(responseData)
      ) {
        throw new Error('LRCLIB returned an unexpected response.')
      }

      setResults(isIdSearch ? [responseData] : responseData)
      setStatus('success')
    } catch (searchError) {
      if (searchError.name === 'AbortError') return

      setError(searchError.message || 'Unable to search LRCLIB. Please try again.')
      setStatus('error')
    } finally {
      if (currentRequest.current === controller) {
        currentRequest.current = null
      }
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="header-content">
          <a className="brand" href="/" aria-label="Lyrics to Language home">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18V5l12-2v13M9 18c0 1.66-1.57 3-3.5 3S2 19.66 2 18s1.57-3 3.5-3S9 16.34 9 18Zm12-2c0 1.66-1.57 3-3.5 3S14 17.66 14 16s1.57-3 3.5-3 3.5 1.34 3.5 3ZM9 9l12-2"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </span>
            <span className="brand-name">
              Lyrics<span>2Language</span>
            </span>
          </a>

          <form className="search-form" role="search" onSubmit={handleSearch}>
            <label className="visually-hidden" htmlFor="site-search">
              Search songs or artists
            </label>
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 4.2 4.2" />
            </svg>
            <input
              id="site-search"
              name="q"
              type="search"
              placeholder="Search by title or artist"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" aria-label="Search">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </button>
          </form>
        </div>
      </header>

      {selectedSong ? (
        <main className="song-page">
          <button
            type="button"
            className="back-button"
            onClick={() => setSelectedSong(null)}
          >
            <span aria-hidden="true">←</span> Back to search results
          </button>
          <article className="song-detail">
            <header className="song-detail-header">
              <p className="eyebrow">Now reading</p>
              <h1>{selectedSong.trackName || 'Untitled song'}</h1>
              <p className="song-detail-artist">
                {selectedSong.artistName || 'Unknown artist'}
              </p>
            </header>
            {selectedSong.plainLyrics || selectedSong.syncedLyrics ? (
              <pre className="song-lyrics">
                {selectedSong.plainLyrics || selectedSong.syncedLyrics}
              </pre>
            ) : (
              <p className="lyrics-unavailable">
                Lyrics are not available for this song.
              </p>
            )}
          </article>
        </main>
      ) : (
        <main className="search-content">
          <div className="page-intro">
            <p className="eyebrow">Lyrics lookup</p>
            <h1>Find a song’s lyrics</h1>
            <p>Search by song title or artist to find lyrics from LRCLIB.</p>
          </div>

          <section
            className="search-results"
            aria-label="Search results"
            aria-busy={status === 'loading'}
            aria-live="polite"
          >
            {status === 'loading' && (
              <p className="search-message">Searching LRCLIB…</p>
            )}
            {status === 'error' && (
              <p className="search-message search-error" role="alert">
                {error}
              </p>
            )}
            {status === 'success' && results.length === 0 && (
              <p className="search-message">No songs found. Try another search.</p>
            )}
            {status === 'success' && results.length > 0 && (
              <>
                <h2 className="results-heading">
                  {results.length} {results.length === 1 ? 'result' : 'results'}
                </h2>
                <div className="lyrics-list">
                  {results.map((song, index) => (
                    <button
                      type="button"
                      className="lyrics-card"
                      key={song.id ?? `${song.trackName}-${song.artistName}-${index}`}
                      onClick={() => setSelectedSong(song)}
                    >
                      <h3>{song.trackName || 'Untitled song'}</h3>
                      <div className="lyrics-card-details">
                        <p className="song-artist">
                          {song.artistName || 'Unknown artist'}
                        </p>
                        <span
                          className={`sync-status${song.syncedLyrics ? ' is-available' : ''}`}
                        >
                          {song.syncedLyrics
                            ? 'Synced lyrics available'
                            : 'No synced lyrics'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        </main>
      )}
    </>
  )
}

export default App
