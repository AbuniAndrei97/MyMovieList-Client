import jwt from 'jsonwebtoken';

export const getUserIdFromToken = () => {
  const token = localStorage.getItem("x-access-token");
  if (!token) return null;

  try {
    const decoded = jwt.decode(token);
    return decoded.id; // Replace 'userId' with the correct property name in your token payload
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};
