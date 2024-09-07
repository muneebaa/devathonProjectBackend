function roleAuthorization(allowedRoles) {
  return (req, res, next) => {
    if (req.isAuthenticated()) {
      // Check if the user's role is in the list of allowed roles
      if (allowedRoles.includes(req.user.role)) {
        return next();
      } else {
        return res
          .status(403)
          .send(
            'Access denied. You do not have permission to perform this action.'
          );
      }
    } else {
      return res.redirect('/login');
    }
  };
}

module.exports = {
  roleAuthorization,
};
