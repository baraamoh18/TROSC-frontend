import { Link } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle";

const NotFoundPage = () => {
  usePageTitle("Page not found");
  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-7xl font-extrabold text-primary mb-4">404</h1>
        <p className="text-2xl font-bold text-gray-900 mb-2">Page not found</p>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block bg-primary text-white font-bold py-2.5 px-6 rounded-xl hover:bg-primary-hover transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
