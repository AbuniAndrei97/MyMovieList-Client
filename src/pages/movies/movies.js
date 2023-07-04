import React, { useState, useContext, useCallback, useEffect } from "react";
import Menu from "../../menu/menu";
import debounce from "lodash.debounce";
import Autosuggest from "react-autosuggest";
import { Link } from "react-router-dom";
import "./movies.css";
import Axios from "axios";
import { authContext } from "../../auxiliary/authContext";
import { fetchAverageRating } from "../../auxiliary/fetchaveragerating";

const TMDB_API_KEY = "e201b8f2a1ff68452013741887178eac";

const Movies = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const { authState } = useContext(authContext);
  const [activeGenre, setActiveGenre] = useState(null);

  const getSuggestions = useCallback(
    debounce(async (value) => {
      if (value.trim().length === 0) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=en-US&query=${value}&page=1&include_adult=false`
        );
        const data = await response.json();
        const results = data.results.slice(0, 10);
        setSuggestions(results);
      } catch (error) {
        console.error("Error fetching movie suggestions:", error);
      }
    }, 300),
    []
  );

  const renderSuggestion = useCallback((suggestion) => {
    return <div>{suggestion.title}</div>;
  }, []);

  const handleSuggestionSelected = async (event, { suggestion }) => {
    setSearchQuery(suggestion.title);
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${suggestion.id}?api_key=${TMDB_API_KEY}&language=en-US`
      );
      const data = await response.json();
      const creditsResponse = await fetch(
        `https://api.themoviedb.org/3/movie/${suggestion.id}/credits?api_key=${TMDB_API_KEY}&language=en-US`
      );
      const creditsData = await creditsResponse.json();
      const genresResponse = await fetch(
        `https://api.themoviedb.org/3/movie/${suggestion.id}?api_key=${TMDB_API_KEY}&language=en-US`
      );
      const genresData = await genresResponse.json();
      const movieDetails = {
        ...data,
        cast: creditsData.cast.slice(0, 10),
        crew: creditsData.crew,
        genres: genresData.genres,
        overview: data.overview,
        runtime: data.runtime,
        budget: data.budget,
        revenue: data.revenue,
      };
      setSearchResults([movieDetails]);
    } catch (error) {
      console.error("Error fetching movie details:", error);
    }
    window.location.href = `/movies/${suggestion.id}`;
  };

  const moviesPerPage = 10; // how many movies to show per page
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastMovie = currentPage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;

  const handleGenreClick = async (genreId) => {
    setActiveGenre(genreId);
    const numPages = 3; // how many pages should it have
    try {
      const movieDetails = [];
      for (let i = 1; i <= numPages; i++) {
        const response = await fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=${i}&with_genres=${genreId}`
        );
        const data = await response.json();
        const movieDetailsPromises = data.results.map(async (movie) => {
          // fetch movie details for each result
          const creditsResponse = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}&language=en-US`
          );
          const creditsData = await creditsResponse.json();
          const genresResponse = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US`
          );
          const genresData = await genresResponse.json();
          const movieDetailsResponse = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US`
          );
          const movieDetailsData = await movieDetailsResponse.json();
          return {
            ...movie,
            cast: creditsData.cast.slice(0, 10),
            crew: creditsData.crew,
            genres: genresData.genres,
            overview: movieDetailsData.overview,
            runtime: movieDetailsData.runtime,
            budget: movieDetailsData.budget,
            revenue: movieDetailsData.revenue,
          };
        });
        const movies = await Promise.all(movieDetailsPromises);
        movieDetails.push(...movies.slice(0, moviesPerPage));
      }
      setSearchResults(movieDetails);
      setCurrentPage(1); // set current page back to 1
    } catch (error) {
      console.error("Error fetching movies by genre:", error);
    }
  };

  const addToMyList = (movie, listType) => {
    Axios.post(
      "https://my-movie-list.herokuapp.com/check-movie",
      {
        id_movies: movie.id,
      },
      {
        headers: {
          "x-access-token": localStorage.getItem("x-access-token"),
        },
      }
    )
      .then((response) => {
        if (response.data.exists) {
          alert("This movie is already in your list!");
        } else {
          Axios.post(
            "https://my-movie-list.herokuapp.com/add-movie",
            {
              id_movies: movie.id,
              status: listType
            },
            {
              headers: {
                "x-access-token": localStorage.getItem("x-access-token"),
              },
            }
          )
            .then((response) => {
              console.log(response);
            })
            .catch((error) => {
              console.log(error);
            });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const MovieDetails = (props) => {
    const movieId = props.movieId;
    const [averageRating, setAverageRating] = useState(null);
    useEffect(() => {
      (async () => {
        const rating = await fetchAverageRating(movieId);
        setAverageRating(rating);
      })();
    }, [movieId]);
    return <p>Average Rating: {averageRating || "N/A"}</p>;
  };

  const handlePageClick = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= 3) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <>
      <Menu />
      <div className="movies-background">
        <h1>Search for Movies</h1>
        <div className="genre-buttons">
          <button className={activeGenre === 28 ? 'active' : ''} onClick={() => handleGenreClick(28)}>Action</button>
          <button className={activeGenre === 12 ? 'active' : ''} onClick={() => handleGenreClick(12)}>Adventure</button>
          <button className={activeGenre === 16 ? 'active' : ''} onClick={() => handleGenreClick(16)}>Animation</button>
          <button className={activeGenre === 35 ? 'active' : ''} onClick={() => handleGenreClick(35)}>Comedy</button>
          <button className={activeGenre === 80 ? 'active' : ''} onClick={() => handleGenreClick(80)}>Crime</button>
          <button className={activeGenre === 99 ? 'active' : ''} onClick={() => handleGenreClick(99)}>Documentary</button>
          <button className={activeGenre === 18 ? 'active' : ''} onClick={() => handleGenreClick(18)}>Drama</button>
          <button className={activeGenre === 10751 ? 'active' : ''} onClick={() => handleGenreClick(10751)}>Family</button>
          <button className={activeGenre === 14 ? 'active' : ''} onClick={() => handleGenreClick(14)}>Fantasy</button>
          <button className={activeGenre === 36 ? 'active' : ''} onClick={() => handleGenreClick(36)}>History</button>
          <button className={activeGenre === 27 ? 'active' : ''} onClick={() => handleGenreClick(27)}>Horror</button>
          <button className={activeGenre === 10402 ? 'active' : ''} onClick={() => handleGenreClick(10402)}>Music</button>
          <button className={activeGenre === 9648 ? 'active' : ''} onClick={() => handleGenreClick(9648)}>Mystery</button>
          <button className={activeGenre === 10749 ? 'active' : ''} onClick={() => handleGenreClick(10749)}>Romance</button>
          <button className={activeGenre === 878 ? 'active' : ''} onClick={() => handleGenreClick(878)}>Science Fiction</button>
          <button className={activeGenre === 10770 ? 'active' : ''} onClick={() => handleGenreClick(10770)}>TV Movie</button>
          <button className={activeGenre === 53 ? 'active' : ''} onClick={() => handleGenreClick(53)}>Thriller</button>
          <button className={activeGenre === 10752 ? 'active' : ''} onClick={() => handleGenreClick(10752)}>War</button>
          <button className={activeGenre === 37 ? 'active' : ''} onClick={() => handleGenreClick(37)}>Western</button>
        </div>
        <div className="search-container">
          <Autosuggest
            suggestions={suggestions}
            onSuggestionsFetchRequested={({ value }) => getSuggestions(value)}
            onSuggestionsClearRequested={() => setSuggestions([])}
            getSuggestionValue={(suggestion) => suggestion.title}
            renderSuggestion={renderSuggestion}
            inputProps={{
              placeholder: "Search for movies",
              value: searchQuery,
              onChange: (_, { newValue }) => setSearchQuery(newValue),
            }}
            onSuggestionSelected={handleSuggestionSelected}
          />
        </div>
        {searchResults.length > moviesPerPage && (
          <div className="pagination-container">
            <button
              className={`buttonpage ${currentPage === 1 ? "disabled" : ""}`}
              onClick={() => handlePageClick(currentPage - 1)}
            >
              Previous
            </button>
            {Array(Math.ceil(searchResults.length / moviesPerPage))
              .fill()
              .map((_, i) => (
                <button
                  key={i + 1}
                  className={`buttonpage ${currentPage === i + 1 ? "active" : ""}`}
                  onClick={() => handlePageClick(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            <button
              className={`buttonpage ${currentPage === Math.ceil(searchResults.length / moviesPerPage)
                ? "disabled"
                : ""
                }`}
              onClick={() => handlePageClick(currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
        <div className="movies-grid-container">
          <ul className="movies-grid-movies">
            {searchResults.length > 0 &&
              searchResults.slice(indexOfFirstMovie, indexOfLastMovie).map((movie) => (
                <li key={movie.id}>
                  <div className="movie-card-movies">
                    <p>
                      <span className="movie-title-movies">{movie.title}</span>
                    </p>
                    {authState.status && (
                      <div className="button-add-list">
                        <button onClick={() => addToMyList(movie, "watched")}>
                          Add to Watched List
                        </button>
                        <button onClick={() => addToMyList(movie, "planToWatch")}>
                          Add to Plan to Watch List
                        </button>
                      </div>
                    )}
                    <Link to={`/movies/${movie.id}`}>
                      <img
                        src={`https://image.tmdb.org/t/p/w500/${movie.poster_path}`}
                        alt={`${movie.title} poster`}
                        width="300"
                      />
                    </Link>
                    <p>Release Date: {movie.release_date}</p>
                    <p>
                      Genres: {movie.genres.map((genre) => genre.name).join(", ")}
                    </p>
                    <MovieDetails movieId={movie.id} />
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </>
  );
}
export default Movies;