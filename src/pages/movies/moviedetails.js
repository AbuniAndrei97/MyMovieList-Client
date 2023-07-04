import React, { useEffect, useContext, useState } from "react";
import { useParams } from "react-router-dom";
import Menu from "../../menu/menu";
import Axios from "axios";
import { authContext } from "../../auxiliary/authContext";
import "./moviedetails.css";

const TMDB_API_KEY = "e201b8f2a1ff68452013741887178eac";

const MovieDetails = () => {
  const [movie, setMovie] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const { id } = useParams();
  const { authState } = useContext(authContext);
  const [trailer, setTrailer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [refreshReviews, setRefreshReviews] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [editedReviewText, setEditedReviewText] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&language=en-US`
        );
        const data = await response.json();
        const creditsResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${id}/credits?api_key=${TMDB_API_KEY}`
        );
        const creditsData = await creditsResponse.json();
        data.cast = creditsData.cast.slice(0, 5);
        setMovie(data);
        const trailerResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_API_KEY}&language=en-US`
        );
        const trailerData = await trailerResponse.json();
        setTrailer(trailerData.results[0]);
        const keywordsResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${id}/keywords?api_key=${TMDB_API_KEY}`
        );
        const keywordsData = await keywordsResponse.json();
        setKeywords(keywordsData.keywords);
      } catch (error) {
        console.error("Error fetching movie details:", error);
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await Axios.get(`https://my-movie-list.herokuapp.com/movie-reviews/${id}`);
        const filteredReviews = response.data.filter(
          (review) => review.movie_id === parseInt(id)
        );
        setReviews(filteredReviews);
      } catch (error) {
        console.error("Error fetching movie reviews:", error);
      }
    };
    fetchMovieDetails();
    fetchReviews();
  }, [id, refreshReviews]);

  const handleReviewSubmit = (event) => {
    event.preventDefault();
    if (!authState.status) {
      alert("Please log in to submit a review.");
      return;
    }
    if (reviewText.length < 10) {
      alert("Review must be at least 10 characters long.");
      return;
    }
    Axios.post(
      `https://my-movie-list.herokuapp.com/add-review`,
      {
        userId: authState && authState.user ? authState.user.id : null,
        movieId: movie.id,
        review: reviewText,
      },
      {
        headers: {
          "x-access-token": localStorage.getItem("x-access-token"),
        },
      }
    )
      .then((response) => {
        console.log(response);
        setReviewText("");
        setRefreshReviews(!refreshReviews);
        const fetchReviews = async () => {
          try {
            const response = await Axios.get(`https://my-movie-list.herokuapp.com/movie-reviews/${id}`);
            const filteredReviews = response.data.filter(
              (review) => review.movie_id === parseInt(id)
            );
            setReviews(filteredReviews);
          } catch (error) {
            console.error("Error fetching movie reviews:", error);
          }
        };
        fetchReviews();
      })
      .catch((error) => {
        console.log(error);
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
            "https://my-movie-list.herokuapp.com/check-movie",
            {
              id_movies: movie.id,
              status: listType === "watched" ? "planToWatch" : "watched",
            },
            {
              headers: {
                "x-access-token": localStorage.getItem("x-access-token"),
              },
            }
          )
            .then((response) => {
              if (response.data.exists) {
                alert(
                  `This movie is already in your ${listType === "watched" ? "Plan to Watch" : "Watched"
                  } list!`
                );
              } else {
                Axios.post(
                  "https://my-movie-list.herokuapp.com/add-movie",
                  {
                    id_movies: movie.id,
                    status: listType,
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
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const addToMyListFavourite = (movie, isFavourite) => {
    Axios.post(
      "https://my-movie-list.herokuapp.com/check-movie-favourite",
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
          alert("This movie is already in your favourites list!");
        } else {
          Axios.post(
            "https://my-movie-list.herokuapp.com/add-movie-favourite",
            {
              id_movies: movie.id,
              favourite: isFavourite,
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

  const handleReviewTextChange = (event) => {
    if (editingReview) {
      setEditedReviewText(event.target.value);
    } else {
      setReviewText(event.target.value);
    }
  };

  const deleteReview = (reviewId) => {
    Axios.delete(`https://my-movie-list.herokuapp.com/delete-review/${reviewId}`, {
      headers: {
        "x-access-token": localStorage.getItem("x-access-token"),
      },
    })
      .then((response) => {
        console.log(response);
        setRefreshReviews(!refreshReviews);
        // Fetch reviews again after deleting a review
        const fetchReviews = async () => {
          try {
            const response = await Axios.get(`https://my-movie-list.herokuapp.com/movie-reviews/${id}`);
            const filteredReviews = response.data.filter(
              (review) => review.movie_id === parseInt(id)
            );
            setReviews(filteredReviews);
          } catch (error) {
            console.error("Error fetching movie reviews:", error);
          }
        };
        fetchReviews();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const editReview = (review) => {
    console.log(review);
    setEditingReview(review);
    setEditedReviewText(review.review);
  };

  const handleEditSubmit = (event) => {
    event.preventDefault();
    if (!authState.status) {
      alert("Please log in to edit your review.");
      return;
    }
    if (editedReviewText.length < 10) {
      alert("Review must be at least 10 characters long.");
      return;
    }
    Axios.put(
      `https://my-movie-list.herokuapp.com/update-review/${editingReview.id}`,
      { review: editedReviewText },
      {
        headers: {
          "x-access-token": localStorage.getItem("x-access-token"),
        },
      }
    )
      .then((response) => {
        console.log(response);
        setEditingReview(null);
        setEditedReviewText("");
        setRefreshReviews(!refreshReviews);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const [selectedReviewText, setSelectedReviewText] = useState("");
  useEffect(() => {
    if (editingReview) {
      setSelectedReviewText(editingReview.review);
    }
  }, [editingReview]);


  const Review = ({ review, authState }) => {
    const [likes, setLikes] = useState(0);
    const [userLiked, setUserLiked] = useState(false);

    useEffect(() => {
      // Check if data exists in local storage
      const storedLikes = localStorage.getItem(`likes_${review.id}`);
      const storedUserLiked = localStorage.getItem(`userLiked_${review.id}`);

      // If data exists, set it as initial state
      if (storedLikes && storedUserLiked) {
        setLikes(parseInt(storedLikes));
        setUserLiked(storedUserLiked === "true");
      }
    }, [review.id]);

    const handleLike = async () => {
      setIsDisabled(true)
      // Update state and local storage
      if (!authState.status) {
        alert("Please log in to like a review.");
        return;
      }
      try {
        const response = await Axios.post(
          `https://my-movie-list.herokuapp.com/toggle-like/${review.id}`,
          {},
          {
            headers: {
              "x-access-token": localStorage.getItem("x-access-token"),
            },
          }
        );
        if (response.data.message === "Like added") {
          const newLikes = likes + 1;
          setLikes(newLikes);
          localStorage.setItem(`likes_${review.id}`, newLikes.toString());
          setUserLiked(true);
          localStorage.setItem(`userLiked_${review.id}`, "true");
        } else if (response.data.message === "Like removed") {
          const newLikes = likes - 1;
          setLikes(newLikes);
          localStorage.setItem(`likes_${review.id}`, newLikes.toString());
          setUserLiked(false);
          localStorage.setItem(`userLiked_${review.id}`, "false");
        }
      } catch (error) {
        console.error("Error toggling like:", error);
      }
      setIsDisabled(false)
    };

    return (
      <div className="review2">
        <button className="button" onClick={handleLike} disabled={isDisabled} >{userLiked ? "Unlike" : "Like"}</button>
        <p className="likenumber"><span>{likes}</span>likes</p>
      </div>
    );
  };

  return (
    <>
      <Menu />
      {movie ? (
        <div>
          <h1>{movie.title}</h1>
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
          <div className="movie-container">
            <div className="poster-container">
              <img
                src={`https://image.tmdb.org/t/p/w500/${movie.poster_path}`}
                alt={`Poster for ${movie.title}`}
                className="poster-image"
              />
            </div>
            <div className="trailer-container">
              {trailer ? (
                <iframe
                  title="Trailer"
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  frameBorder="0"
                  allowFullScreen
                  className="trailer-iframe"
                ></iframe>
              ) : (
                <p>No trailer available.</p>
              )}
            </div>
          </div>
          {authState.status && (
            <div className="button-add-list-favourite">
              <button className="button" onClick={() => addToMyListFavourite(movie, true)}>
                Add to Favourite List
              </button>
            </div>
          )}
          <p>{movie.overview}</p>
          <p>Release Date: {movie.release_date}</p>
          <p>Runtime: {movie.runtime} min</p>
          <p>
            Budget: {movie.budget ? `$${movie.budget.toLocaleString()}` : "Private"}
          </p>
          <p>
            Revenue:{" "}
            {movie.revenue ? `$${movie.revenue.toLocaleString()}` : "Private"}
          </p>
          {movie.genres && (
            <p>Genres: {movie.genres.map((genre) => genre.name).join(", ")}</p>
          )}
          {movie.cast && (
            <p>Top Cast: {movie.cast.map((actor) => actor.name).join(", ")}</p>
          )}
          {keywords.length > 0 && (
            <p>
              Keywords:{" "}
              {keywords.slice(0, 3).map((keyword) => keyword.name).join(", ")}
            </p>
          )}
          {authState.status && (
            <div className="reviews">
              <h2>Reviews</h2>
              <form onSubmit={handleReviewSubmit}>
                <label htmlFor="reviewText">Leave a review:</label>
                <textarea
                  id="reviewText"
                  name="reviewText"
                  rows="4"
                  cols="50"
                  placeholder="Review must be at least 10 characters."
                  value={reviewText}
                  onChange={handleReviewTextChange}
                ></textarea>
                <button className="button" type="submit">Submit</button>
              </form>
              <div className="review-list">
                {reviews && reviews.length > 0 ? (
                  <div>
                    {reviews.map((review) => (
                      <div className="review" key={review.id}>
                        {review.username && <strong>{review.username} posted this review:</strong>}{" "}
                        {review.review}
                        {authState.status && authState.username && review.user_id === authState.id && (
                          <>
                            <button className="button" onClick={() => deleteReview(review.id)}>Delete</button>
                            <button className="button" onClick={() => editReview(review)}>Edit</button>
                          </>
                        )}
                        <Review key={review.id} review={review} authState={authState} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No reviews yet.</p>
                )}
              </div>
            </div>
          )}
          {editingReview && (
            <>
              <h2>Edit Review</h2>
              <form onSubmit={handleEditSubmit}>
                <label htmlFor="editReviewText">Edit your review:</label>
                <textarea
                  id="editReviewText"
                  name="editReviewText"
                  rows="4"
                  cols="50"
                  placeholder="Review must be at least 10 characters."
                  value={editedReviewText}
                  onChange={(event) => setEditedReviewText(event.target.value)}
                ></textarea>
                <input type="hidden" name="selectedReviewText" value={selectedReviewText} />
                <button className="button" type="submit">Save Changes</button>
                <button className="button" onClick={() => setEditingReview(null)}>Cancel</button>
              </form>
            </>
          )}
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </>
  );
}

export default MovieDetails;