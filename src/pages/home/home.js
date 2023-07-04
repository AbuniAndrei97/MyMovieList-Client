import "./home.css";
import React, { useEffect, useContext, useState } from "react";
import Menu from "../../menu/menu";
import Axios from "axios";
import { authContext } from "../../auxiliary/authContext";
import { fetchAverageRating } from "../../auxiliary/fetchaveragerating";

const Home = () => {
  const [movies, setMovies] = useState([]);
  const { authState } = useContext(authContext);

  useEffect(() => {
    Axios.get(
      `https://api.themoviedb.org/3/trending/movie/week?api_key=e201b8f2a1ff68452013741887178eac`
    )
      .then((response) => {
        Promise.all(
          response.data.results.map((movie) => displayMovieDetails(movie))
        ).then((moviesWithCredits) => {
          setMovies(moviesWithCredits);
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const fetchMovieCredits = (movieId) => {
    return Axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=e201b8f2a1ff68452013741887178eac`
    );
  };

  const fetchMovieGenres = (movieId) => {
    return Axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=e201b8f2a1ff68452013741887178eac&language=en-US`
    );
  };

  const displayMovieDetails = (movie) => {
    return Promise.all([
      fetchMovieCredits(movie.id),
      fetchMovieGenres(movie.id),
    ]).then(([creditsResponse, genresResponse]) => {
      movie.credits = creditsResponse.data;
      movie.genres = genresResponse.data.genres;
      return movie;
    });
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

  return (
    <>
      <Menu />
      <div className="home-background">
        <h1>Trending Movies</h1>
        <ul className="movies-grid-home">
          {movies.map((movie) => (
            <li key={movie.id}>
              <div className="movie-card-home">
                <p><span className="movie-title-home">{movie.title}</span></p>
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
                <a href={`https://mymovielist-app.vercel.app/movies/${movie.id}`}>
                  <img
                    src={`https://image.tmdb.org/t/p/w500/${movie.poster_path}`}
                    alt={`${movie.title} poster`}
                    width="300"
                  />
                </a>
                <p>Release Date: {movie.release_date}</p>
                <p>
                  Genres:{" "}
                  {movie.genres.map((genre) => genre.name).join(", ")}
                </p>
                <MovieDetails movieId={movie.id} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Home;