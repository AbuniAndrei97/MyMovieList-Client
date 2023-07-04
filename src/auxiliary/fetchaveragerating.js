import Axios from "axios";

export const fetchAverageRating = async (movieId) => {
  try {
    const response = await Axios.get(`https://my-movie-list.herokuapp.com/average-rating/${movieId}`);
    return response.data.averageRating;
  } catch (error) {
    console.log(error);
    return null;
  }
};