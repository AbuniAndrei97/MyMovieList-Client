import React, { useState, useEffect, useContext } from "react";
import Menu from "../../menu/menu";
import Axios from "axios";
import "./newsfeed.css";
import { useNavigate } from "react-router-dom";
import { authContext } from "../../auxiliary/authContext";

const Newsfeed = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  // eslint-disable-next-line
  const { authState } = useContext(authContext);
  const [userMovieStatus, setUserMovieStatus] = useState([]);
  const [favouriteMovies, setFavouriteMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const TMDB_API_KEY = "e201b8f2a1ff68452013741887178eac";

  useEffect(() => {
    const searchUsers = async () => {
      const response = await Axios.get(
        `https://my-movie-list.herokuapp.com/search-users/${searchQuery}`,
        {
          headers: {
            "x-access-token": localStorage.getItem("x-access-token"),
          },
        }
      );
      setSearchResults(response.data);
    };
    if (searchQuery !== "") searchUsers();
  }, [searchQuery]);

  const handleSelect = (selectedUser) => {
    navigate(`/profile/${selectedUser.id}`);
  };

  useEffect(() => {
    const getFriendReviews = async () => {
      try {
        const response = await Axios.get(
          `https://my-movie-list.herokuapp.com/friend-reviews/${authState.id}`,
          {
            headers: {
              "x-access-token": localStorage.getItem("x-access-token"),
            },
          }
        );
        const reviewsWithMovieNames = await fetchMovieNames(response.data);
        setReviews(reviewsWithMovieNames.map(review => ({ ...review, type: 'review' })));
      } catch (err) {
        console.log(err);
      }
    };
    if (authState.id) {
      getFriendReviews();
    }
  }, [authState.id]);

  const fetchUserMovieNames = async (statuses) => {
    const updatedStatuses = await Promise.all(
      statuses.map(async (status) => {
        const movieData = await fetchMovieNameAndPoster(status.id_movies);
        return { ...status, movie_name: movieData.title, posterPath: movieData.posterPath };
      })
    );
    return updatedStatuses;
  };

  useEffect(() => {
    const fetchUserMovieStatus = async () => {
      setLoading(true);
      try {
        const response = await Axios.get(
          `https://my-movie-list.herokuapp.com/user-movie-status/${authState.id}`,
          {
            headers: {
              "x-access-token": localStorage.getItem("x-access-token"),
            },
          }
        );
        const statusesWithMovieNamesAndPoster = await fetchUserMovieNames(response.data);
        setUserMovieStatus(statusesWithMovieNamesAndPoster.map(status => ({ ...status, type: 'status' })));
      } catch (err) {
        console.log(err);
      }
      setLoading(false);
    };
    if (authState.id) {
      fetchUserMovieStatus();
    }
  }, [authState.id]);

  useEffect(() => {
    const fetchUserFavouriteMovies = async () => {
      try {
        const response = await Axios.get(
          `https://my-movie-list.herokuapp.com/user-movie-favourite/${authState.id}`,
          {
            headers: {
              "x-access-token": localStorage.getItem("x-access-token"),
            },
          }
        );
        const favouriteMoviesWithNamesAndPoster = await fetchUserMovieNames(response.data);
        setFavouriteMovies(favouriteMoviesWithNamesAndPoster.map(movie => ({ ...movie, type: 'favourite' })));
      } catch (err) {
        console.log(err);
      }
    };

    if (authState.id) {
      fetchUserFavouriteMovies();
    }
  }, [authState.id]);

  const combinedEntries = [...reviews, ...userMovieStatus, ...favouriteMovies];

  const handleUserSelect = (selectedUserId) => {
    navigate(`/profile/${selectedUserId}`);
  };

  const handleMovieSelect = (movieId) => {
    navigate(`/movies/${movieId}`);
  };

  const fetchMovieNameAndPoster = async (movieId) => {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`
    );
    const data = await response.json();
    return { title: data.title, posterPath: data.poster_path };
  };

  const fetchMovieNames = async (reviews) => {
    const updatedReviews = await Promise.all(
      reviews.map(async (review) => {
        const movieData = await fetchMovieNameAndPoster(review.movie_id);
        return { ...review, movie_name: movieData.title, posterPath: movieData.posterPath };
      })
    );
    return updatedReviews;
  };

  return (
    <>
      <div className="newsfeed-page">
        <Menu />
        <h2>Search for username</h2>
        <div className="search-container-newsfeed">
          <input
            type="text"
            placeholder="Search by username"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchResults.length > 0 && (
            <ul className="search-dropdown-newsfeed">
              {searchResults.map((user) => (
                <li
                  key={user.id}
                  className="search-item-newsfeed"
                  onClick={() => handleSelect(user)}
                >
                  {user.username}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="newsfeed-container">
          {loading ? (
            <div></div>
          ) : (
            <>
              {combinedEntries.map((entry, index) => {
                switch (entry.type) {
                  case 'review':
                    return (
                      <div key={index}>
                        <a href={`https://mymovielist-app.vercel.app/movies/${entry.movie_id}`}>
                          <div className="posterWrapperrReviewsNewsfeed">
                            <img
                              src={`https://image.tmdb.org/t/p/w500${entry.posterPath}`}
                              alt={entry.movie_name}
                              className="posterImageReviewsNewsfeed"
                            />
                          </div>
                        </a>
                        <p>
                          <span
                            style={{ fontWeight: "bold" }}
                            onClick={() => handleUserSelect(entry.user_id)}
                            className="username-hyper"
                          >
                            {entry.username}
                          </span>{" "}
                          posted this review for the movie "
                          <span
                            style={{ fontWeight: "bold" }}
                            onClick={() => handleMovieSelect(entry.movie_id)}
                            className="movie-hyper"
                          >
                            {entry.movie_name}
                          </span>
                          ":
                          {entry.review}
                        </p>
                      </div>
                    );
                  case 'status':
                    return (
                      <div key={index}>
                        <a href={`https://mymovielist-app.vercel.app/movies/${entry.id_movies}`}>
                          <div className="posterWrapperStatusNewsfeed">
                            <img
                              src={`https://image.tmdb.org/t/p/w500${entry.posterPath}`}
                              alt={entry.movie_name}
                              className="posterImageStatusNewsfeed"
                            />
                          </div>
                        </a>
                        <p>
                          <span
                            style={{ fontWeight: "bold" }}
                            onClick={() => handleUserSelect(entry.id_user)}
                            className="username-hyper"
                          >
                            {entry.username}
                          </span>{" "}
                          added movie{" "}
                          <span
                            style={{ fontWeight: "bold" }}
                            onClick={() => handleMovieSelect(entry.id_movies)}
                            className="movie-hyper"
                          >
                            {entry.movie_name}
                          </span>{" "}
                          to the{" "}
                          <span style={{ fontWeight: "bold" }}>{entry.status}</span> list.
                        </p>
                      </div>
                    );
                  case 'favourite':
                    return (
                      <div key={index}>
                        <a href={`https://mymovielist-app.vercel.app/movies/${entry.id_movies}`}>
                          <div className="posterWrapperFavouriteNewsfeed">
                            <img
                              src={`https://image.tmdb.org/t/p/w500${entry.posterPath}`}
                              alt={entry.movie_name}
                              className="posterImageFavouriteNewsfeed"
                            />
                          </div>
                        </a>
                        <p>
                          <span
                            style={{ fontWeight: "bold" }}
                            onClick={() => handleUserSelect(entry.id_user)}
                            className="username-hyper"
                          >
                            {entry.username}
                          </span>{" "}
                          added movie{" "}
                          <span
                            style={{ fontWeight: "bold" }}
                            onClick={() => handleMovieSelect(entry.id_movies)}
                            className="movie-hyper"
                          >
                            {entry.movie_name}
                          </span>{" "}
                          to the{" "}
                          <span style={{ fontWeight: "bold" }}>favourite </span> list.
                        </p>
                      </div>
                    );
                  default:
                    return null;
                }
              })}
            </>
          )}
        </div>
      </div>
    </>
  );

};

export default Newsfeed;