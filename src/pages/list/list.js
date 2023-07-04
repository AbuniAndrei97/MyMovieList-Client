import React, { useState, useEffect, } from 'react';
import Menu from '../../menu/menu';
import './list.css';
import Axios from "axios";
import { Modal, Select } from 'antd';

const List = () => {
  const [movies, setMovies] = useState([]);
  const [selectedOption, setSelectedOption] = useState("watched");
  const [watchedMoviesCount, setWatchedMoviesCount] = useState(0);
  const [planToWatchCount, setPlanToWatchCount] = useState(0);
  const { Option } = Select;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  const showModal = (movieId, currentRating) => {
    document.body.style.overflow = 'auto';
    setSelectedMovieId(movieId);
    setSelectedRating(currentRating !== "" ? currentRating.toString() : "");
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    await handleRatingChange(selectedMovieId, selectedRating);
    setMovies((prevMovies) =>
      prevMovies.map((movie) =>
        movie.id === selectedMovieId ? { ...movie, rating: parseFloat(selectedRating) } : movie
      )
    );
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    document.body.style.overflow = 'unset';
    setIsModalVisible(false);
  };

  const handleSelectChange = value => {
    setSelectedRating(value);
  };

  useEffect(() => {
    Axios.get("https://my-movie-list.herokuapp.com/fetch-movies", {
      headers: {
        "x-access-token": localStorage.getItem("x-access-token"),
      },
    })
      .then((response) => {
        Promise.all(
          response.data.movies.map(async (movie) => {
            const movieDetails = await fetchMovieDetails(movie.id_movies, movie.status);
            const averageRating = await fetchAverageRating(movie.id_movies);
            return {
              ...movieDetails,
              rating: movie.rating || "",
              averageRating: averageRating || "N/A",
            };
          })
        ).then((moviesWithDetails) => {
          setMovies(moviesWithDetails);
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  useEffect(() => {
    const watchedCount = movies.filter((movie) => movie.statuss === "watched").length;
    const planToWatchCount = movies.filter((movie) => movie.statuss === "planToWatch").length;
    setWatchedMoviesCount(watchedCount);
    setPlanToWatchCount(planToWatchCount);
  }, [movies]);

  const fetchMovieDetails = (movieId, movieStatus, movieRating) => {
    return Axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=e201b8f2a1ff68452013741887178eac&append_to_response=credits`
    ).then((response) => {
      const movie = response.data;
      const credits = movie.credits;
      const genres = movie.genres;
      const posterPath = movie.poster_path;
      return { ...movie, credits, genres, posterPath, statuss: movieStatus, rating: movieRating };
    });
  };

  const handleOptionClick = (option) => {
    setSelectedOption(option);
  };

  const handleRemoveClick = (movieId, status) => {
    Axios.delete(`https://my-movie-list.herokuapp.com/remove-movie/${movieId}?status=${status}`, {
      headers: {
        "x-access-token": localStorage.getItem("x-access-token"),
      },
    })
      .then(() => {
        Axios.get("https://my-movie-list.herokuapp.com/fetch-movies", {
          headers: {
            "x-access-token": localStorage.getItem("x-access-token"),
          },
        })
          .then((response) => {
            Promise.all(
              response.data.movies.map(async (movie) => {
                const movieDetails = await fetchMovieDetails(movie.id_movies, movie.status);
                const averageRating = await fetchAverageRating(movie.id_movies);
                return {
                  ...movieDetails,
                  rating: movie.rating || "",
                  averageRating: averageRating || "N/A",
                };
              })
            ).then((moviesWithDetails) => {
              setMovies(moviesWithDetails);
              setWatchedMoviesCount(
                moviesWithDetails.filter((movie) => movie.statuss === "watched").length
              );
              setPlanToWatchCount(
                moviesWithDetails.filter((movie) => movie.statuss === "planToWatch").length
              );
            });
          })
          .catch((error) => {
            console.log(error);
          });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleRatingChange = async (movieId, rating) => {
    setMovies((prevMovies) =>
      prevMovies.map((movie) =>
        movie.id === movieId ? { ...movie, rating: parseFloat(rating) } : movie
      )
    );
    await Axios.put(
      "https://my-movie-list.herokuapp.com/update-movie-rating",
      {
        id_movies: movieId,
        rating: parseFloat(rating),
      },
      {
        headers: {
          "x-access-token": localStorage.getItem("x-access-token"),
        },
      }
    );

    const updatedAverageRating = await fetchAverageRating(movieId);
    setMovies((prevMovies) =>
      prevMovies.map((movie) =>
        movie.id === movieId ? { ...movie, averageRating: updatedAverageRating } : movie
      )
    );
  };

  const fetchAverageRating = async (movieId) => {
    try {
      const response = await Axios.get(`https://my-movie-list.herokuapp.com/average-rating/${movieId}`);
      return response.data.averageRating;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  return (
    <>
      <Menu />
      <h1>My Movie List</h1>
      <div className="options-list">
        <button
          onClick={() => handleOptionClick("watched")}
          disabled={selectedOption === "watched"}
        >
          Watched
        </button>
        <p>Number of watched movies: {watchedMoviesCount}</p>
        <button
          onClick={() => handleOptionClick("planToWatch")}
          disabled={selectedOption === "planToWatch"}
        >
          Plan to Watch
        </button>
        <p>Number of movies to watch: {planToWatchCount}</p>
      </div>
      <ul className="movies-grid-list ">
        {movies &&
          movies.map((movie) => {
            if (movie.statuss === selectedOption) {
              return (
                <li key={movie.id}>
                  <div className="movie-card-list ">
                    <p><span className="movie-title-list">{movie.title}</span></p>
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
                      {movie.genres ? movie.genres.map((genre) => genre.name).join(", ") : "N/A"}
                    </p>
                    <div className="button-add-list">
                      {movie.statuss === "watched" ? (
                        <>
                          <span>
                            <button onClick={() => handleRemoveClick(movie.id, "watched")}>
                              Remove from Watched List
                            </button>
                          </span>
                          <br />
                          <span>
                            <span>
                              Rating:{" "}
                              <button className='ratingbutton' onClick={() => showModal(movie.id, movie.rating)}>
                                {movie.rating !== "" ? movie.rating.toString() : "0"}
                              </button>
                            </span>
                            <span className='averagerating'>
                              Average Rating: {movie.averageRating}
                            </span>
                          </span>
                        </>
                      ) : (
                        <button onClick={() => handleRemoveClick(movie.id, "planToWatch")}>
                          Remove from Plan to Watch List
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            } else {
              return null;
            }
          })}
      </ul>
      <Modal title="Rate this movie" open={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
        <p>Select your rating:</p>
        <Select value={selectedRating} style={{ width: 100 }} onChange={handleSelectChange}>
          {[...Array(10)].map((_, index) => (
            <Option key={index + 1} value={index + 1}>
              {index + 1}
            </Option>
          ))}
        </Select>
      </Modal>
    </>
  );
};

export default List;