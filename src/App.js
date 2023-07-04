import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Axios from "axios";
import React, { useState, useEffect } from 'react';
import Login from "./pages/login/login";
import Register from "./pages/register/register";
import Home from "./pages/home/home";
import Movies from "./pages/movies/movies";
import Profile from "./pages/profile/profile";
import ProfilePublic from "./pages/profile/profilepublic";
import List from "./pages/list/list";
import Newsfeed from "./pages/newsfeed/newsfeed";
import MovieDetails from './pages/movies/moviedetails';
import { authContext } from "./auxiliary/authContext";

function App() {
    const [authState, setAuthState] = useState({
        email: "",
        username: "",
        status: false,
        id: 0,
    });

    useEffect(() => {
        const userAuthenticated = async () => {
            const response = await Axios.get("https://my-movie-list.herokuapp.com/isUserAuth", {
                headers: {
                    "x-access-token": localStorage.getItem("x-access-token"),
                },
            })
            if (response.data.error) {
                console.log("nu esti logat")
            }
            else {
                setAuthState({
                    username: response.data.username,
                    email: response.data.email,
                    id: response.data.userId,
                    status: true,
                })
            }
        };
        userAuthenticated();
    }, []);

    return (
        <>
            <authContext.Provider value={{ authState, setAuthState }}>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/movies" element={<Movies />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/list" element={<List />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/movies/:id" element={<MovieDetails />} />
                        <Route path="/newsfeed" element={<Newsfeed />} />
                        <Route path="/profile/:id" element={<ProfilePublic />} />
                    </Routes>
                </BrowserRouter>
            </authContext.Provider>
        </>
    );
}

export default App;