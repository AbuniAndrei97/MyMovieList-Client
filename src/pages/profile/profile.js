import React, { useState, useEffect, useContext } from 'react';
import Menu from "../../menu/menu";
import { Modal, Button, Avatar } from 'antd';
import Axios from "axios";
import { authContext } from "../../auxiliary/authContext";
import "./profile.css";

const Profile = () => {
  const { authState } = useContext(authContext);
  const [pfpSrc, setPfpSrc] = useState('');
  const [visible, setVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [pfps, setPfps] = useState([]);
  const [watchedMoviesCount, setWatchedMoviesCount] = useState(0);
  const [planToWatchCount, setPlanToWatchCount] = useState(0);
  const [description, setDescription] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description);
  const [location, setLocation] = useState('');
  const [editedLocation, setEditedLocation] = useState(location);
  const [editModeLocation, setEditModeLocation] = useState(false);
  const [movies, setMovies] = useState([]);
  const [friendRequests, setFriendRequests] = useState({});
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPfps = async () => {
    const response = await Axios.get("https://my-movie-list.herokuapp.com/fetch-pfps");
    setPfps(response.data)
  }

  useEffect(() => {
    fetchPfps();
    fetchMovieCounts();
    myProfile();
  }, []);

  const myProfile = async () => {
    const response = await Axios.post("https://my-movie-list.herokuapp.com/myprofile", {
    },
      {
        headers: {
          "x-access-token": localStorage.getItem("x-access-token"),
        }
      });
    setPfpSrc(response.data.pfp_src);
    setDescription(response.data.description);
    setLocation(response.data.location);
  }

  const fetchMovieCounts = async () => {
    const response = await Axios.get("https://my-movie-list.herokuapp.com/fetch-movies", {
      headers: {
        "x-access-token": localStorage.getItem("x-access-token"),
      },
    });
    const watchedCount = response.data.movies.filter((movie) => movie.status === "watched").length;
    const planToWatchCount = response.data.movies.filter((movie) => movie.status === "planToWatch").length;
    setWatchedMoviesCount(watchedCount);
    setPlanToWatchCount(planToWatchCount);
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchPfps();
      await myProfile();
      await fetchMovieCounts();
      setIsLoading(false); // Set the loading state to false once data is fetched
    };
    fetchData();
  }, []);


  const showModal = () => {
    setVisible(true);
  }

  const handleOk = async () => {
    if (selectedImage) {
      const response = await Axios.post("https://my-movie-list.herokuapp.com/change-pfp", {
        pfpcode: selectedImage,
      },
        {
          headers: {
            "x-access-token": localStorage.getItem("x-access-token"),
          }
        });
      if (response.data.type === "success") {
        myProfile();
      }
    }
    setVisible(false);
  }

  const handleCancel = () => {
    setVisible(false);
  }

  const handleDescriptionChange = (event) => {
    setEditedDescription(event.target.value);
  }
  const handleLocationChange = (event) => {
    setEditedLocation(event.target.value);
  }

  const handleEdit = () => {
    setEditMode(true);
  }
  const handleEditlocation = () => {
    setEditModeLocation(true);
  }
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedLocation(location);
  }

  const handleCancelEditlocation = () => {
    setEditModeLocation(false);
    setEditedLocation(location);
  }

  useEffect(() => {
    setEditedLocation(location);
  }, [location]);

  useEffect(() => {
    setEditedDescription(description);
  }, [description]);

  const handleSave = async () => {
    const response = await Axios.post(
      "https://my-movie-list.herokuapp.com/update-description",
      { description: editedDescription },
      {
        headers: { "x-access-token": localStorage.getItem("x-access-token") },
      }
    );
    if (response.data.type === "success") {
      myProfile();
      setEditMode(false);
    }
  };

  const handleSavelocation = async () => {
    const response = await Axios.post(
      "https://my-movie-list.herokuapp.com/update-location",
      { location: editedLocation },
      {
        headers: { "x-access-token": localStorage.getItem("x-access-token") },
      }
    );
    if (response.data.type === "success") {
      myProfile();
      setEditModeLocation(false);
    }
  };

  useEffect(() => {
    Axios.post("https://my-movie-list.herokuapp.com/fetch-movie-favourite", {}, {
      headers: {
        "x-access-token": localStorage.getItem("x-access-token"),
      },
    })
      .then((response) => {
        Promise.all(
          response.data.movies.map(async (movie) => {
            const movieDetails = await fetchMovieDetails(movie.id_movies);
            return {
              ...movieDetails,
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

  const fetchMovieDetails = (movieId) => {
    return Axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=e201b8f2a1ff68452013741887178eac&append_to_response=credits`
    ).then((response) => {
      const movie = response.data;
      const credits = movie.credits;
      const genres = movie.genres;
      const posterPath = movie.poster_path;
      return { ...movie, credits, genres, posterPath };
    });
  };

  const removeFromFavorites = async (movieId) => {
    try {
      await Axios.post(
        "https://my-movie-list.herokuapp.com/remove-movie-favourite",
        { movieId },
        {
          headers: {
            "x-access-token": localStorage.getItem("x-access-token"),
          },
        }
      );
      setMovies(movies.filter((movie) => movie.id !== movieId));
    } catch (error) {
      console.error("Error removing movie from favorites:", error);
    }
  };

  const fetchFriendRequests = async () => {
    const response = await Axios.get(`https://my-movie-list.herokuapp.com/friend-requests/${authState.id}`, {
      headers: {
        "x-access-token": localStorage.getItem("x-access-token"),
      },
    });
    setFriendRequests(response.data);
  };
  useEffect(() => {
    if (authState.id) {
      fetchFriendRequests();
    }
  }, [authState.id]);

  const acceptFriendRequest = async (userId, friendId) => {
    try {
      const response = await Axios.put("https://my-movie-list.herokuapp.com/friend-requests/accept", {
        userId,
        friendId,
      }, {
        headers: {
          "x-access-token": localStorage.getItem("x-access-token"),
        },
      });
      if (response.data.type === "success") {
        const updatedFriendRequests = friendRequests.filter((request) => request.id !== friendId);
        setFriendRequests(updatedFriendRequests);
      }
      window.location.reload();

    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const declineFriendRequest = async (userId, friendId) => {
    try {
      const response = await Axios.put("https://my-movie-list.herokuapp.com/friend-requests/decline", {
        userId,
        friendId,
      }, {
        headers: {
          "x-access-token": localStorage.getItem("x-access-token"),
        },
      });
      if (response.data.type === "success") {
        const updatedFriendRequests = friendRequests.filter((request) => request.id !== friendId);
        setFriendRequests(updatedFriendRequests);
      }
      window.location.reload();
    } catch (error) {
      console.error("Error declining friend request:", error);
    }
  };

  const fetchFriends = async () => {
    const response = await Axios.get(`https://my-movie-list.herokuapp.com/friends/${authState.id}`, {
      headers: {
        "x-access-token": localStorage.getItem("x-access-token"),
      },
    });
    setFriends(response.data);
  };

  useEffect(() => {
    if (authState.id) {
      fetchFriends();
    }
  }, [authState.id]);

  return (
    <>
      <Menu />
      {isLoading ? (
        <div className='spinner'></div>
      ) : (
        <>
          <Avatar size={150} icon="" src={`data:image;base64,${pfpSrc}`} />
          <div className="profilePicChanger">
            <Button type="primary" onClick={showModal} style={{ fontWeight: 'bold', color: 'black' }}>
              Change picture
            </Button>
            <Modal
              title="Profile Picture Changer"
              open={visible}
              onOk={handleOk}
              onCancel={handleCancel}
            >
              {pfps.map((image, index) => {
                return (
                  <img
                    key={index}
                    src={`data:image;base64,${image.src}`}
                    onClick={() => setSelectedImage(image.pfpcode)}
                    height="100px"
                    alt=""
                  />
                );
              })}
            </Modal>
          </div>
          {friendRequests.length > 0 && (
            <div>
              <h2>Friend Requests:</h2>
              <ul>
                {friendRequests.map((request) => (
                  <div key={request.id}>
                    <p>{request.username}</p>
                    <button className='button' onClick={() => acceptFriendRequest(authState.id, request.id)}>Accept</button>
                    <button className='button' onClick={() => declineFriendRequest(authState.id, request.id)}>Decline</button>
                  </div>
                ))}
              </ul>
            </div>
          )}
          <h2>Your username is: {authState.username}</h2>
          <h2>Your email is: {authState.email}</h2>
          <h2>Number of watched movies: {watchedMoviesCount}</h2>
          <h2>Number of movies to watch: {planToWatchCount}</h2>
          <div className="friends-list">
            <h2 style={{ margin: 0 }}>Friend list:</h2>
            {friends.map((friend, index) => (
              <span
                key={friend.id}
                className="friend-username"
                style={{ color: "black", cursor: "pointer" }}
                onClick={() => {
                  window.location.href = `/profile/${friend.id}`;
                }}
              >
                {friend.username}{index < friends.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
          {!editMode ? (
            <>
              <div className='profile-align-description'>
                <h2>Description: </h2>
                <h2>{description}</h2>
              </div>
              <button className="button" onClick={handleEdit}>Edit</button>
            </>
          ) : (
            <>
              <div className='profile-align-description-edit'>
                <h2>Description: </h2>
                <input type="text" value={editedDescription} onChange={handleDescriptionChange} />
              </div>
              <button className="button" onClick={handleSave}>Save</button>
              <button className="button" onClick={handleCancelEdit}>Cancel</button>
            </>
          )}
          {!editModeLocation ? (
            <>
              <div className='profile-align-location'>
                <h2>Location: </h2>
                <h2>{location}</h2>
              </div>
              <button className="button" onClick={handleEditlocation}>Edit</button>
            </>
          ) : (
            <>
              <div>
                <h2>Location: </h2>
                <input type="text" value={editedLocation} onChange={handleLocationChange} />
              </div>
              <button className="button" onClick={handleSavelocation}>Save</button>
              <button className="button" onClick={handleCancelEditlocation}>Cancel</button>
            </>
          )
          }
          <h2>Favourite movies: </h2>
          {movies.length > 0 && (
            <>
              {movies.map((movie) => (
                <div key={movie.id} className="movieCardFavourite">
                  <a href={`https://mymovielist-app.vercel.app/movies/${movie.id}`}>
                    <div className="posterWrapper">
                      <img
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        className="posterImageFavourite"
                      />
                      <div className="movieTitleFavourite">{movie.title}</div>
                    </div>
                  </a>
                  <button className="removeButton" onClick={() => removeFromFavorites(movie.id)}>Remove</button>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </>
  );

}

export default Profile;