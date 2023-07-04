import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Menu from "../../menu/menu";
import "./profilepublic.css";
import Axios from "axios";
import { Avatar } from 'antd';
import { getUserIdFromToken } from '../../auxiliary/authHelper';

function ProfilePublic() {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [username, setUsername] = useState('');
  const { id } = useParams();
  const [pfpSrc, setPfpSrc] = useState('');
  //to hide pfps not being used
  // eslint-disable-next-line
  const [pfps, setPfps] = useState([]);
  const [watchedMoviesCount, setWatchedMoviesCount] = useState(0);
  const [planToWatchCount, setPlanToWatchCount] = useState(0);
  const [movies, setMovies] = useState([]);
  const [alreadyFriends, setAlreadyFriends] = useState(false);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const fetchPfps = async () => {
      const response = await Axios.get("https://my-movie-list.herokuapp.com/fetch-pfps");
      setPfps(response.data)
    }
    fetchPfps();
    fetchMovieCounts();
  }, []);


  useEffect(() => {
    const myProfile = async () => {
      try {
        const loggedInUserId = getUserIdFromToken();
        const response = await Axios.post(`https://my-movie-list.herokuapp.com/profile/${id}`, {
          myId: loggedInUserId,
        }, {
          headers: {
            "x-access-token": localStorage.getItem("x-access-token"),
          }
        });
        setDescription(response.data.description);
        setLocation(response.data.location);
        setUsername(response.data.username);
        setPfpSrc(response.data.pfp_src);
        setAlreadyFriends(response.data.alreadyFriends)
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };
    myProfile();
  }, [])

  const fetchMovieCounts = async () => {
    const response = await Axios.get(`https://my-movie-list.herokuapp.com/fetch-movies/${id}`, {
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
    Axios.get(`https://my-movie-list.herokuapp.com/fetch-movie-favourite/${id}`, {}, {
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
  }, [id]);

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

  const token = localStorage.getItem("x-access-token");
  const loggedInUserId = getUserIdFromToken();

  const sendFriendRequest = async (senderId, receiverId) => {
    try {
      const response = await Axios.post("https://my-movie-list.herokuapp.com/send-friend-request", {
        senderId,
        receiverId,
      }, {
        headers: {
          "x-access-token": localStorage.getItem("x-access-token"),
        },
      });
      console.log("Friend request response:", response);
      alert("Friend request sent!");
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("Failed to send friend request.");
    }
  };

  const deleteFriend = async (loggedInUserId, friendId) => {
    try {
      console.log(`Attempting to delete friend ${friendId}`);
      const response = await Axios.delete(`https://my-movie-list.herokuapp.com/delete-friend/${loggedInUserId}/${friendId}`, {
        headers: {
          "x-access-token": localStorage.getItem("x-access-token"),
        },
      });
      console.log("Friend deletion response:", response);
      alert("Friend deleted!");
      setAlreadyFriends(false); // update the state variable
    } catch (error) {
      console.error("Error deleting friend:", error);
      alert("Failed to delete friend.");
    }
  };

  return (
    <>
      <Menu />
      {loading ? (<div></div>  
      ) : (
        <>
          <Avatar size={64} icon="" src={`data:image;base64,${pfpSrc}`} />
          {token && loggedInUserId && loggedInUserId !== id && (
            <>
              {alreadyFriends ? (
                <button className="button" onClick={() => deleteFriend(loggedInUserId, id)}>
                  Remove Friend
                </button>
              ) : (
                <button className="button" onClick={() => sendFriendRequest(loggedInUserId, id)}>
                  Add Friend
                </button>
              )}
            </>
          )}
          <h2>Username: {username}</h2>
          <h2>Number of watched movies: {watchedMoviesCount}</h2>
          <h2>Number of movies to watch: {planToWatchCount}</h2>
          <h2>Description: {description}</h2>
          <h2>Location: {location}</h2>
          <h2>Favourite movies: </h2>
          {movies.length > 0 && (
            <>
              {movies.map((movie) => (
                <div key={movie.id} className="movieCardFavourite-profile">
                  <a href={`https://mymovielist-app.vercel.app/movies/${movie.id}`}>
                    <div className="posterWrapper-profile">
                      <img
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        className="posterImageFavourite-profile"
                      />
                      <div className="movieTitleFavourite-profile">{movie.title}</div>
                    </div>
                  </a>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </>
  );
  

};

export default ProfilePublic;
