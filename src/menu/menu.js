import React, { useContext, useEffect } from "react";
import { authContext } from "../auxiliary/authContext";
import { useNavigate, NavLink } from "react-router-dom";
import "./menu.css"

function Menu() {
  const { authState, setAuthState } = useContext(authContext);
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("x-access-token");
    setAuthState({ email: "", status: false, username: "", id: 0 });
    navigate("/");
  };

  useEffect(() => {
    const token = localStorage.getItem("x-access-token");
    if (!token) {
      setAuthState({ email: "", status: false, username: "", id: 0 });
    }
  }, []);

  return (
    <div>
      {authState.status ?
        <div className="menulogat">
          <ul id="navlogat">
            <NavLink exact to="/" activeclassname="active" className="homecolour">Home</NavLink>
            <NavLink to="/movies" activeclassname="active" className="moviescolour">Movies</NavLink>
            <NavLink to="/list" activeclassname="active" className="listcolour">List</NavLink>
            <NavLink to="/newsfeed" activeclassname="active" className="newsfeedcolour">Newsfeed</NavLink>
            <NavLink to="/profile" activeclassname="active" className="profilecolour">Profile</NavLink>
            <button onClick={logout} className="logoutcolour">Logout</button>
          </ul>
        </div>
        :
        <div className="menu">
          <ul id="nav">
            <NavLink exact to="/" activeclassname="active" className="homecolour">Home</NavLink>
            <NavLink to="/movies" activeclassname="active" className="moviescolour">Movies</NavLink>
            <NavLink to="/login" activeclassname="active" className="logincolour">Login</NavLink>
            <NavLink to="/register" activeclassname="active" className="registercolour">Register</NavLink>
          </ul>
        </div>
      }
    </div>
  );
}

export default Menu;
