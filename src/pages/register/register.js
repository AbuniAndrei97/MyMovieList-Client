import "../../menu/menu.css";
import "./register.css";
import Axios from "axios";
import React, { useState } from "react";
import Menu from "../../menu/menu";
import { useNavigate } from "react-router-dom";

function Register() {
    const [emailReg, setEmailReg] = useState("");
    const [usernameReg, setUsernameReg] = useState("");
    const [passwordReg, setPasswordReg] = useState("");
    const [passwordRegConfirm, setPasswordRegConfirm] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    const register = (event) => {
        event.preventDefault();
        if (passwordReg === passwordRegConfirm) {
            if (emailReg.includes("@")) {
                if (passwordReg.length >= 4) {
                    Axios.post("https://my-movie-list.herokuapp.com/register", {
                        email: emailReg,
                        username: usernameReg,
                        password: passwordReg,
                    })
                        .then((response) => {
                            console.log(response);
                            navigate("/login");
                        })
                        .catch((error) => {
                            if (error.response.status === 409) {
                                const message = "Email or username already exists 🙂";
                                console.log(message);
                                setErrorMessage(message);
                                document.querySelector(".error-message").classList.add("show-error");
                            } else {
                                const message = "Error occurred while registering";
                                console.log(message);
                                setErrorMessage(message);
                                document.querySelector(".error-message").classList.add("show-error");
                            }
                        });
                } else {
                    const message = "Password must be at least 4 characters 🙂";
                    console.log(message);
                    setErrorMessage(message);
                    document.querySelector(".error-message").classList.add("show-error");
                }
            } else {
                const message = "Invalid email address 🙂";
                console.log(message);
                setErrorMessage(message);
                document.querySelector(".error-message").classList.add("show-error");
            }
        } else {
            const message = "Password doesn't match 🙂";
            console.log(message);
            setErrorMessage(message);
            document.querySelector(".error-message").classList.add("show-error");
        }
    };

    const alreadygotacc = () => {
        navigate("/login");
    };

    return (
        <>
            <Menu />
            <div className="login">
                <div className="login-triangle"></div>
                <h2 className="login-header">Register</h2>
                <div className="error-message">{errorMessage}</div>
                <form className="login-container">
                    <input type="text" placeholder="Email" onChange={(e) => setEmailReg(e.target.value)} />
                    <input type="text" placeholder="Username" onChange={(e) => setUsernameReg(e.target.value)} />
                    <input type="password" placeholder="Password" onChange={(e) => setPasswordReg(e.target.value)} />
                    <input type="password" placeholder="Confirm Password" onChange={(e) => setPasswordRegConfirm(e.target.value)} />
                    <input type="submit" value="Register" onClick={register} />
                    <button onClick={alreadygotacc} className="alreadygotacccolour">Already got account</button>
                </form>
            </div>
        </>
    );
}

export default Register;