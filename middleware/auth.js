const setUser = (req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
};

//protect routes only for logged in users
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

module.exports = {
  setUser,
  requireLogin,
};
