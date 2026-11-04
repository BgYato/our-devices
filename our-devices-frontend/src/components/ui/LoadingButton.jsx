function LoadingButton({ isLoading, children, ...props }) {
  const { className, ...buttonProps } = props;
  return (
    <button
      {...buttonProps}
      disabled={isLoading || buttonProps.disabled}
      className={`flex cursor-pointer items-center justify-center rounded-lg bg-blue-600 py-2 font-semibold text-white shadow-lg transition duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${className || "w-full"}`}
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
