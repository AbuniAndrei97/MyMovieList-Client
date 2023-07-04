import React from "react";
import { Link } from "react-router-dom";

const MovieResult = ({ movie, includePoster }) => {
  const handleClick = () => {
    window.location.href = `/movies/${movie.id}`;
  };

  return (
    <div className="movie-result" onClick={handleClick}>
      {includePoster && movie.poster_path && (
        <Link to={`/movies/${movie.id}`}>
          <img
            src={`https://image.tmdb.org/t/p/w500/${movie.poster_path}`}
            alt={`Poster for ${movie.title}`}
            width="200"
          />
        </Link>
      )}

      <div>
        <h2>{movie.title}</h2>
        <p>Release Date: {movie.release_date}</p>
        <p>Vote Average: {movie.vote_average}</p>
        <p>Vote Count: {movie.vote_count}</p>
        {movie.cast && (
          <p>Top Cast: {movie.credits.cast.map((actor) => actor.name).join(", ")}</p>
        )}
        {movie.genres && (
          <p>Genres: {movie.genres.map((genre) => genre.name).join(", ")}</p>
        )}
        <p>Overview: {movie.overview}</p>
        <p>Runtime: {movie.runtime} min</p>
        <p>
          Budget:{" "}
          {movie.budget ? `$${movie.budget.toLocaleString()}` : "Private"}
        </p>
        <p>
          Revenue:{" "}
          {movie.revenue ? `$${movie.revenue.toLocaleString()}` : "Private"}
        </p>
      </div>
    </div>
  );
};

export default MovieResult;