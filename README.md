# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request](https://github.com/github/awesome-copilot/pull/1761) <!-- github.com/<owner>/<repo>/pull/<[0-9]+> -->
- `Ctrl + click` View illustration [index.html](https://jhauga.github.io/support-repo/)

<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!-- formatter_1 -->
Support branch for new plugin vibe-coder.

- **Agent**: Copilot CLI
- **Model**: Claude Sonnet 4.5
  - **Number of Prompts**: 1-5
- **Model**: GPT-5.4
  - **Number of Prompts**: 6-8
- **Total Prompts**: 8
- **Post Edits**: 2

## Results

The end results are good. A minified imdb using TMDB API. It took like 4 or 5 prompts, but it's a little [imdb.com](https://www.imdb.com/) app.

```markdown

     ## IMDB Emulator v2.0 - Powered by TMDB 🎬

     A beautiful, feature-rich movie discovery application with dynamic data from The Movie Database (TMDB) API, with OMDb as a smart fallback.

     ### ✨ Features

     **v2.0 Major Update:**
     - 🎨 **Beautiful Modern UI** - Gradient design with smooth animations
     - 🎬 **TMDB Integration** - Rich movie data with cast, trailers, and high-quality images
     - 🎭 **Cast & Crew Gallery** - Scrollable cast photos with character names
     - 🎥 **Embedded Trailers** - Watch movie trailers directly in the app
     - ⭐ **Multiple Ratings** - TMDB and IMDB ratings side-by-side
     - 🔄 **Smart Fallback** - Automatically falls back to OMDb if TMDB fails
     - 📱 **Responsive Design** - Works beautifully on all devices

     **Core Features:**
     - 🎲 Random Top 250 Movie Generator
     - 🏆 Random Oscar Winner Generator
     - 🔍 Advanced Search (Movies & TV Shows)
     - 📊 Inline Movie Details from Search Results
     - 🖼️ High-Quality Posters & Backdrops
     - 🔗 Direct Links to IMDB & TMDB
     - 👁️ Toggleable Result Panels for Apps and Search

     ### 🚀 Quick Start

     1. Open `index.html` in your browser
     2. Click "Get Random Top 250 Movie" or "Get Random Oscar Winning Movie"
     3. Search for any movie/TV show in the Search section and use "View Details" to open the rich inline detail view

     ### 📝 Prompts Used

     #### Prompt 1: Initial Vibe Coding
     ```bash
     vibe code @index.html
     lock it
     ```

     #### Prompt 2: Dynamic ID Scraping
     ```text
     No hardcoded ids. Create a clever algorithm that dynamically pulls the ids from:

     - https://www.imdb.com/search/title/?groups=best_picture_winner&sort=year,desc
       - For `Random Oscar Winning Movie`
     - https://www.imdb.com/chart/top/
       - For `Random Top 250 Movie`

     From search link is still to imdb.com title's page. Create a clever algorithm that
     creates a minified imdb page from search of omdb api call.

     Have `graphic-designer` look at @minifiedComposition.svg and `quasi-coder` look at
     @index.original.html (but DO NOT edit `index.original.html`) to get the gist of the
     fetch and insertion of html for the data using the imdbID from each search.

     So, update @index.html:

     - Update inline apps to use dynamic data, and not using hardcoded
     - Clever algorithm to fetch and scrape movie data from imdb.com using
      the imdbID returned from search that uses omdb API
     ```

     #### Prompt 3: Major v2.0 Upgrade with TMDB
     ```text
     Using the current gist of @index.html, we want to do a major version change.
     Use the current OMDb as a fallback, but add the TMDB API. See:

     - https://developer.themoviedb.org/docs/append-to-response
     - https://developer.themoviedb.org/docs/search-and-query-for-details

     API Key: << API_KEY >>
     Access Token: << API_TOKEN >>

     For the rest - surprise me!
     ```

     ### 🎨 What Makes v2.0 Special

     **The "Surprise Me" Features:**

     1. **Stunning Visual Design**
        - Purple gradient theme (inspired by movie magic 🎭)
        - Smooth hover animations on cards
        - Beautiful backdrop images for movie details
        - Professional loading spinners

     2. **Rich Movie Experience**
        - Full-width backdrop images with gradient overlays
        - Floating poster images for cinematic feel
        - Cast member photos in scrollable gallery
        - Genre badges with custom styling
        - Embedded YouTube trailers

     3. **Smart API Strategy**
        - TMDB as primary source (richer data)
        - Automatic fallback to OMDb on failure
        - Uses TMDB's `append_to_response` for efficient data fetching
        - Fetches: credits, videos, images, and similar movies in one call

     4. **Enhanced UX**
        - Font Awesome icons throughout
        - Loading states with spinning animations
        - Smooth scroll-to-top on pagination
        - Larger, more touch-friendly buttons
        - Better spacing and readability

     ### 🔧 Technical Implementation

     **API Integration:**
     - **TMDB API**: Primary data source using `find`, `movie`, and `search` endpoints
     - **OMDb API**: Fallback for reliability
     - **Append to Response**: Efficient data fetching (`credits,videos,images,similar`)

     **Data Flow:**
     1. User triggers action (random movie or search)
     2. Fetch IMDB IDs (scraped from IMDB or fallback lists)
     3. Query TMDB API using IMDB ID via `find` endpoint
     4. Fetch detailed movie data with `append_to_response`
     5. If TMDB fails, fall back to OMDb
     6. Render beautiful UI with all available data

     **Fallback Strategy:**
     ```
     TMDB API → Success → Rich Display
         ↓
       Fails
         ↓
     OMDb API → Success → Basic Display
         ↓
       Fails
         ↓
     Error Message
     ```

     ### 📊 Data Sources

     - **TMDB (Primary)**: Trailers, cast, high-res images, detailed metadata
     - **OMDb (Fallback)**: Basic movie info, IMDB ratings
     - **IMDB (ID Source)**: Dynamic scraping of Top 250 and Oscar winners (with fallback lists)

     ### 🎯 Architecture Highlights

     - **Zero Dependencies**: Pure vanilla JavaScript
     - **Responsive**: Bootstrap 4.4.1 for grid and components
     - **Modern**: ES6+ async/await, template literals
     - **Maintainable**: Well-organized code sections with comments
     - **Error Handling**: Graceful degradation at every level

     ### 🌟 User Experience

     **Loading States:**
     - "Loading Top 250 list..." (fetching IDs)
     - "Loading movie data from TMDB..." (API call)
     - Animated spinner for visual feedback

     **Progressive Enhancement:**
     - Basic movie info always available (OMDb fallback)
     - Enhanced features when TMDB succeeds (trailers, cast)
     - Smooth animations don't block functionality

     ### 🚧 Known Limitations

     **CORS Restrictions:**
     Direct IMDB scraping is blocked by browser CORS policies. The app:
     - Attempts dynamic scraping
     - Falls back to curated ID lists
     - User experience is unaffected

     **Solutions for Production:**
     1. Backend proxy server (recommended)
     2. Server-side ID scraping with caching
     3. CORS proxy service (dev/testing only)

     ### 📁 Project Structure

     ```
     support-repo/
     ├── index.html              # Main application (v2.0)
     ├── index.original.html     # Original shorthand reference
     ├── index.new.html          # Clean backup (v1.0)
     ├── README.md               # This file
     ├── IMPLEMENTATION_NOTES.md # Technical deep dive
     ├── minifiedComposition.svg # Visual reference
     ├── minifiedComposition.json # Data structure reference
     └── favicon.png             # App icon
     ```

     ### 🎬 Credits

     Built with:
     - [TMDB API](https://www.themoviedb.org/documentation/api) - Rich movie database
     - [OMDb API](http://www.omdbapi.com/) - Reliable fallback
     - [Bootstrap 4](https://getbootstrap.com/docs/4.4/) - UI framework
     - [Font Awesome 5](https://fontawesome.com/) - Beautiful icons
     - GitHub Copilot CLI - AI-powered development

     **Special Thanks:**
     - The Movie Database (TMDB) for their comprehensive API
     - Open Movie Database (OMDb) for reliable backup data
     - GitHub Copilot for the vibe-coder workflow

     ### 📄 License

     See project license for details.

     ---

     **Version History:**
     - v2.0 (2026-05-19): TMDB integration, beautiful UI, trailers, cast gallery, inline search details, toggleable app and search results
     - v1.0 (2026-05): Dynamic IMDB scraping, OMDb integration
     - v0.1: Initial vibe-coded prototype
```

Made verbose documentation, so - all `md` files here created by prompt. Finished with prompts like:

```text
# Claude Post Prompts

## prompt 4
graphic-designer fix the menu, and do away with the purple gradients.
Make the look professionsal for @index.html 

## prompt 5
Liar. The menu is in the middle of the page. Put and fix it to the top of page.
The functional elements cannot be clicked.

# GPT Post Prompts

## prompt 6
/vibe-coder Update @index.html to:

- Use the imdbID, or movie id returned from search when "View Details" is clicked,
 similar to how inline apps on page parse html
 - Add one link below "View Detail" as "View on TMDB" linking as it does now
- For two apps, add a button that allows the results to be toggled

### Asked user Confirm this Vibe Lock before I edit:  
Vibe Lock
---------
Feel:         clean, inline, action-first 
Outcome:      open details from the search result's returned imdbID or movie…
  └ Outcome: open details from the search result's staying on index.html using TMDB
             api similar to how both apps parse html and data for movies, keep a
             separate TMDB link, and let both app result panels toggle open or closed

## prompt 7
/graphic-designer Look at @toggleButton.svg as it is:

- Rendered
- As SVG tag data, reading tag `id` attribute for additional prompting

Goal: update only @index.html using only data from the SVG file to add the toggle button(s) for:

- "Get Random Top 250 Movie"
- "Get Random Oscar Winning Movie"

## prompt 8
/graphic-designer Great! For the search portion of @index.html we want to:

- Add a button with the same functionality as the toggle button for the apps
- Create a new design for the toggle icon
  - For the design - suprise me!
```

### Post Edits

**1.**

```bash
move index.new.html index.html
```

**2.**

- Manually added the move ids for IMDB's top 250, and Oscar winners.
<!-- formatter_2 -->