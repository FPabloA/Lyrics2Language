import { useEffect, useRef, useState } from 'react'
import './App.css'

function getLyricLines(lyrics = '') {
  return lyrics
    .split(/\r?\n/)
    .map((line) =>
      line.replace(/^\s*\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\]\s*/, '').trim(),
    )
    .filter(Boolean)
}

function shuffleIndices(length) {
  const order = Array.from({ length }, (_, index) => index)
  for (let index = order.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const currentIndex = order[index]
    order[index] = order[randomIndex]
    order[randomIndex] = currentIndex
  }
  return order
}

function FlashcardStudy({
  originalLines,
  translatedLines,
  status,
  error,
  order,
  index,
  flipped,
  onFlip,
  onToggleShuffle,
  onPrevious,
  onNext,
}) {
  const lineIndex = order[index] ?? index
  const translation = translatedLines[lineIndex]

  if (originalLines.length === 0) {
    return (
      <p className="flashcard-message">
        Lyrics are not available for flashcards.
      </p>
    )
  }

  return (
    <section className="flashcard-study" aria-label="Lyrics flashcards">
      {status === 'loading' && (
        <p className="flashcard-message" aria-live="polite">
          Preparing translated flashcards…
        </p>
      )}
      {status === 'error' && (
        <p className="flashcard-error" role="alert">
          {error}
        </p>
      )}
      {status === 'success' && (
        <>
          {translatedLines.length !== originalLines.length && (
            <p className="flashcard-message">
              Some translated lines may not align with the original lyrics.
            </p>
          )}
          <div className="flashcard-toolbar">
            <p className="flashcard-count">
              Card {index + 1} of {originalLines.length}
            </p>
            <button
              type="button"
              className="shuffle-button"
              aria-pressed={order.length > 0}
              onClick={onToggleShuffle}
            >
              {order.length > 0 ? 'Turn shuffle off' : 'Shuffle cards'}
            </button>
          </div>
          <button
            type="button"
            className={`flashcard${flipped ? ' is-flipped' : ''}`}
            onClick={onFlip}
            aria-label={
              flipped
                ? 'Show original lyric'
                : 'Show translated lyric'
            }
            aria-pressed={flipped}
          >
            <span className="flashcard-side-label">
              {flipped ? 'Translation' : 'Original lyric'}
            </span>
            <span className="flashcard-text">
              {flipped
                ? translation || 'No matching translated line is available.'
                : originalLines[lineIndex]}
            </span>
            <span className="flashcard-hint">Click to flip</span>
          </button>
          <nav className="flashcard-navigation" aria-label="Flashcard navigation">
            <button
              type="button"
              onClick={onPrevious}
              disabled={index === 0}
              aria-label="Previous flashcard"
            >
              <span aria-hidden="true">←</span> Previous
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={index === originalLines.length - 1}
              aria-label="Next flashcard"
            >
              Next <span aria-hidden="true">→</span>
            </button>
          </nav>
        </>
      )}
    </section>
  )
}

function FlashcardQuiz({
  originalLines,
  translatedLines,
  status,
  error,
  order,
  onToggleShuffle,
}) {
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [complete, setComplete] = useState(false)
  const lineIndex = order[index] ?? index

  if (status === 'loading') {
    return (
      <p className="flashcard-message" aria-live="polite">
        Preparing quiz…
      </p>
    )
  }

  if (status === 'error') {
    return (
      <p className="flashcard-error" role="alert">
        {error}
      </p>
    )
  }

  if (originalLines.length === 0) {
    return (
      <p className="flashcard-message">
        Lyrics are not available for this quiz.
      </p>
    )
  }

  if (complete) {
    return (
      <section className="quiz-complete" aria-live="polite">
        <div className="flashcard-toolbar">
          <p className="flashcard-count">
            {order.length > 0 ? 'Shuffle on' : 'Original order'}
          </p>
          <button
            type="button"
            className="shuffle-button"
            aria-pressed={order.length > 0}
            onClick={onToggleShuffle}
          >
            {order.length > 0 ? 'Turn shuffle off' : 'Shuffle quiz'}
          </button>
        </div>
        <p className="eyebrow">Quiz complete</p>
        <h2>
          You got {score} out of {originalLines.length} correct
        </h2>
        <button
          type="button"
          className="flashcard-mode-button"
          onClick={() => {
            setIndex(0)
            setAnswer('')
            setSubmitted(false)
            setScore(0)
            setComplete(false)
          }}
        >
          Try again
        </button>
      </section>
    )
  }

  const translation = translatedLines[lineIndex]

  function assessAnswer(wasCorrect) {
    if (wasCorrect) {
      setScore((currentScore) => currentScore + 1)
    }

    if (index === originalLines.length - 1) {
      setComplete(true)
      return
    }

    setIndex((currentIndex) => currentIndex + 1)
    setAnswer('')
    setSubmitted(false)
  }

  return (
    <section className="quiz-study" aria-label="Lyrics translation quiz">
      <div className="flashcard-toolbar">
        <p className="flashcard-count">
          {order.length > 0 ? 'Shuffle on' : 'Original order'}
        </p>
        <button
          type="button"
          className="shuffle-button"
          aria-pressed={order.length > 0}
          onClick={onToggleShuffle}
        >
          {order.length > 0 ? 'Turn shuffle off' : 'Shuffle quiz'}
        </button>
      </div>
      {translatedLines.length !== originalLines.length && (
        <p className="flashcard-message">
          Some translated lines may not align with the original lyrics.
        </p>
      )}
      <p className="flashcard-count">
        Question {index + 1} of {originalLines.length}
      </p>
      <div className="quiz-card">
        <p className="flashcard-side-label">Translate this lyric</p>
        <p className="flashcard-text">{originalLines[lineIndex]}</p>
      </div>
      {!submitted ? (
        <form
          className="quiz-answer-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (answer.trim()) setSubmitted(true)
          }}
        >
          <label htmlFor="quiz-answer">Your translation</label>
          <textarea
            id="quiz-answer"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Type your translation…"
            rows={3}
            required
          />
          <button
            type="submit"
            className="flashcard-mode-button"
            disabled={!answer.trim()}
          >
            Check answer
          </button>
        </form>
      ) : (
        <div className="quiz-reveal">
          <p className="quiz-reveal-label">Your answer</p>
          <p className="quiz-user-answer">{answer}</p>
          <p className="flashcard-side-label">Direct translation</p>
          <p className="quiz-translation">
            {translation || 'No matching translated line is available.'}
          </p>
          <p className="quiz-assessment-prompt">
            Was your answer correct?
          </p>
          <div className="quiz-assessment">
            <button type="button" onClick={() => assessAnswer(true)}>
              I got it right
            </button>
            <button type="button" onClick={() => assessAnswer(false)}>
              I got it wrong
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedSong, setSelectedSong] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [sourceLanguage, setSourceLanguage] = useState('auto')
  const [targetLanguage, setTargetLanguage] = useState('en')
  const [translatedLyrics, setTranslatedLyrics] = useState('')
  const [translationStatus, setTranslationStatus] = useState('idle')
  const [translationError, setTranslationError] = useState('')
  const [flashcardMode, setFlashcardMode] = useState(false)
  const [quizMode, setQuizMode] = useState(false)
  const [flashcardIndex, setFlashcardIndex] = useState(0)
  const [flashcardFlipped, setFlashcardFlipped] = useState(false)
  const [shuffledOrder, setShuffledOrder] = useState([])
  const [quizShuffledOrder, setQuizShuffledOrder] = useState([])
  const [quizShuffleVersion, setQuizShuffleVersion] = useState(0)
  const currentRequest = useRef(null)

  useEffect(() => {
    return () => currentRequest.current?.abort()
  }, [])

  useEffect(() => {
    const lyrics = selectedSong?.plainLyrics || selectedSong?.syncedLyrics
    if (!selectedSong || !lyrics) return

    const controller = new AbortController()

    async function translateLyrics() {
      try {
        const response = await fetch('http://localhost:5000/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            q: lyrics,
            source: sourceLanguage,
            target: targetLanguage,
            format: 'text',
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`LibreTranslate returned an error (${response.status}).`)
        }

        const data = await response.json()
        if (typeof data.translatedText !== 'string') {
          throw new Error('LibreTranslate returned an unexpected response.')
        }

        setTranslatedLyrics(data.translatedText)
        setTranslationStatus('success')
      } catch (requestError) {
        if (requestError.name === 'AbortError') return

        setTranslationError(
          requestError instanceof TypeError
            ? 'Could not connect to LibreTranslate. Make sure it is running on port 5000 and allows requests from this app.'
            : requestError.message || 'Unable to translate these lyrics.',
        )
        setTranslationStatus('error')
      }
    }

    translateLyrics()
    return () => controller.abort()
  }, [selectedSong, sourceLanguage, targetLanguage])

  function selectSong(song) {
    setSelectedSong(song)
    setFlashcardMode(false)
    setQuizMode(false)
    setFlashcardIndex(0)
    setFlashcardFlipped(false)
    setTranslatedLyrics('')
    setTranslationError('')
    setTranslationStatus(
      song.plainLyrics || song.syncedLyrics ? 'loading' : 'idle',
    )
  }

  function handleTargetLanguageChange(event) {
    setTargetLanguage(event.target.value)
    setFlashcardFlipped(false)
    setTranslatedLyrics('')
    setTranslationError('')
    setTranslationStatus(
      selectedSong?.plainLyrics || selectedSong?.syncedLyrics
        ? 'loading'
        : 'idle',
    )
  }

  function handleSourceLanguageChange(event) {
    setSourceLanguage(event.target.value)
    setFlashcardFlipped(false)
    setTranslatedLyrics('')
    setTranslationError('')
    setTranslationStatus(
      selectedSong?.plainLyrics || selectedSong?.syncedLyrics
        ? 'loading'
        : 'idle',
    )
  }

  function toggleFlashcardShuffle() {
    const lines = getLyricLines(
      selectedSong?.plainLyrics || selectedSong?.syncedLyrics || '',
    )

    if (shuffledOrder.length > 0) {
      setShuffledOrder([])
    } else {
      setShuffledOrder(shuffleIndices(lines.length))
    }

    setFlashcardIndex(0)
    setFlashcardFlipped(false)
  }

  function toggleQuizShuffle() {
    const lines = getLyricLines(
      selectedSong?.plainLyrics || selectedSong?.syncedLyrics || '',
    )
    setQuizShuffledOrder((currentOrder) =>
      currentOrder.length > 0 ? [] : shuffleIndices(lines.length),
    )
    setQuizShuffleVersion((version) => version + 1)
  }

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
            <div className="study-mode-control">
              <button
                type="button"
                className="flashcard-mode-button"
                aria-pressed={flashcardMode}
                onClick={() => {
                  setFlashcardMode(!flashcardMode)
                  setQuizMode(false)
                  setFlashcardIndex(0)
                  setFlashcardFlipped(false)
                  setShuffledOrder([])
                  setQuizShuffledOrder([])
                }}
              >
                {flashcardMode ? 'Back to lyrics' : 'Study with flashcards'}
              </button>
              <button
                type="button"
                className="flashcard-mode-button"
                aria-pressed={quizMode}
                onClick={() => {
                  setQuizMode(!quizMode)
                  setFlashcardMode(false)
                  setFlashcardIndex(0)
                  setFlashcardFlipped(false)
                  setShuffledOrder([])
                  setQuizShuffledOrder([])
                  setQuizShuffleVersion((version) => version + 1)
                }}
              >
                {quizMode ? 'Back to lyrics' : 'Quiz yourself'}
              </button>
            </div>
            {flashcardMode ? (
              <FlashcardStudy
                originalLines={getLyricLines(
                  selectedSong.plainLyrics || selectedSong.syncedLyrics || '',
                )}
                translatedLines={getLyricLines(translatedLyrics)}
                status={translationStatus}
                error={translationError}
                order={shuffledOrder}
                index={flashcardIndex}
                flipped={flashcardFlipped}
                onToggleShuffle={toggleFlashcardShuffle}
                onFlip={() => setFlashcardFlipped(!flashcardFlipped)}
                onPrevious={() => {
                  setFlashcardIndex(flashcardIndex - 1)
                  setFlashcardFlipped(false)
                }}
                onNext={() => {
                  setFlashcardIndex(flashcardIndex + 1)
                  setFlashcardFlipped(false)
                }}
              />
            ) : quizMode ? (
              <FlashcardQuiz
                key={quizShuffleVersion}
                originalLines={getLyricLines(
                  selectedSong.plainLyrics || selectedSong.syncedLyrics || '',
                )}
                translatedLines={getLyricLines(translatedLyrics)}
                status={translationStatus}
                error={translationError}
                order={quizShuffledOrder}
                onToggleShuffle={toggleQuizShuffle}
              />
            ) : (
              <div className="song-columns">
              <section className="lyrics-panel" aria-labelledby="original-lyrics-title">
                <div className="language-heading">
                  <h2 id="original-lyrics-title">Original lyrics</h2>
                  <label className="visually-hidden" htmlFor="source-language">
                    Original lyrics language
                  </label>
                  <select
                    id="source-language"
                    value={sourceLanguage}
                    onChange={handleSourceLanguageChange}
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                    <option value="zh-Hans">Chinese (Simplified)</option>
                    <option value="zh-Hant">Chinese (Traditional)</option>
                  </select>
                </div>
                {selectedSong.plainLyrics || selectedSong.syncedLyrics ? (
                  <pre className="song-lyrics">
                    {selectedSong.plainLyrics || selectedSong.syncedLyrics}
                  </pre>
                ) : (
                  <p className="lyrics-unavailable">
                    Lyrics are not available for this song.
                  </p>
                )}
              </section>
              <section className="lyrics-panel" aria-labelledby="translated-lyrics-title">
                <div className="language-heading">
                  <h2 id="translated-lyrics-title">Translation</h2>
                  <label className="visually-hidden" htmlFor="target-language">
                    Translation language
                  </label>
                  <select
                    id="target-language"
                    value={targetLanguage}
                    onChange={handleTargetLanguageChange}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                    <option value="zh-Hans">Chinese (Simplified)</option>
                    <option value="zh-Hant">Chinese (Traditional)</option>
                  </select>
                </div>
                {translationStatus === 'loading' && (
                  <p className="translation-message" aria-live="polite">
                    Translating lyrics…
                  </p>
                )}
                {translationStatus === 'error' && (
                  <p className="translation-error" role="alert">
                    {translationError}
                  </p>
                )}
                {translationStatus === 'success' && (
                  <pre className="song-lyrics">{translatedLyrics}</pre>
                )}
                {translationStatus === 'idle' && (
                  <p className="lyrics-unavailable">
                    No lyrics available to translate.
                  </p>
                )}
              </section>
              </div>
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
                      onClick={() => selectSong(song)}
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
      <footer className="page-footnote">
        <p>
          Translations are generated by machine translation. Important context
          may be missed, which can lead to incorrect translations.
        </p>
      </footer>
    </>
  )
}

export default App
