function LoadingButton({ isLoading, children, ...props }) {
  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`w-full cursor-pointer flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow-lg transition duration-200 disabled:opacity-50`}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
      ) : (
        children
      )}
    </button>
  );
}

export default LoadingButton;
