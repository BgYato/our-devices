let navigate;

export const setNavigator = (nav) => {
  navigate = nav;
};

export const navigateTo = (path, options = {}) => {
  if (navigate) {
    navigate(path, options);
  }
};