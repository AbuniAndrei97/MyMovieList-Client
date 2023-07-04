import "../../menu/menu.css"
import './login.css';
import Axios from "axios";
import React, { useState, useContext } from 'react';
import Menu from "../../menu/menu"
import { useNavigate } from "react-router-dom";
import { authContext } from "../../auxiliary/authContext";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setAuthState } = useContext(authContext);
  const [errorMessage, setErrorMessage] = useState("");

  const login = (event) => {
    event.preventDefault();
    Axios.post("https://my-movie-list.herokuapp.com/login", {
      email: email,
      password: password,
    }).then((response) => {
      if (!response.data.auth) {
        const message = response.data.message;
        console.log(message);
        setErrorMessage(message);
        document.querySelector(".error-message").classList.add("show-error");
      } else {
        localStorage.setItem("x-access-token", response.data.token);
        setAuthState({
          username: response.data.username,
          email: response.data.email,
          id: response.data.id,
          status: true,
        })
        navigate('/profile');
      }
    })
      .catch((error) => {
        if (error.response.status === 401) {
          const message = "Invalid email or password 🙂";
          console.log(message);
          setErrorMessage(message);
          document.querySelector(".error-message").classList.add("show-error");
        } else if (error.response.status === 404) {
          const message = "Email doesn't exist 🙂";
          console.log(message);
          setErrorMessage(message);
          document.querySelector(".error-message").classList.add("show-error");
        } else {
          const message = "Error occurred while logging in 🙂";
          console.log(message);
          setErrorMessage(message);
          document.querySelector(".error-message").classList.add("show-error");
        }
      });
  };

  const newaccount = () => {
    navigate("/register");
  }

  return (
    <>
      <Menu />
      <div className="login">
        <div className="login-triangle"></div>
        <h2 className="login-header">Login</h2>
        <div className="error-message">{errorMessage}</div>
        <form className="login-container">
          <input type="text" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
          <input type="submit" value="Log in" onClick={login} />
          <button onClick={newaccount} className="newaccountcolour">Need new account</button>
        </form>
        <div className="error-message">{errorMessage}</div>
      </div>
    </>
  );
}

export default Login;