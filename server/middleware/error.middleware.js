// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : null
  });
};

// Handle 404 routes
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
};

// Helper function for error responses
export const errorResponse = (res, status, message, error = null, details = null) => {
  const response = {
    success: false,
    message: message
  };

  if (error && process.env.NODE_ENV === "development") {
    response.error = error;
  }

  if (details) {
    response.details = details;
  }

  return res.status(status).json(response);
}; 