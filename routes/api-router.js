const router = require('express').Router();
const { addAppointment } = require('../controllers/appointment');
const { addDoctorAvailability, getDoctors } = require('../controllers/user');
const { API_ERRORS, USER_ROLE } = require('../lib/constants');
const { serverErrorResponse } = require('../lib/utils');
const { isAuthenticated } = require('../middlewares/authentication');
const { roleAuthorization } = require('../middlewares/authorization');

router.get('/test', (req, res) => {
  return res.json({ hello: 'test api' });
});

// doctor sets his appointments
router.post(
  '/doctors/:doctorId/availability',
  isAuthenticated,
  roleAuthorization([USER_ROLE.Doctor]),
  async (req, res) => {
    // TODO: perform validation
    try {
      const doctorId = req.params.doctorId;
      await addDoctorAvailability(doctorId, req.body);
      return res.status(201).end();
    } catch (error) {
      console.error(error);
      return serverErrorResponse(res);
    }
  }
);

// patient sees doctors availability
router.get(
  '/doctors',
  isAuthenticated,
  roleAuthorization([USER_ROLE.Patient]),
  async (req, res) => {
    try {
      const doctors = await getDoctors();
      return res.json({ doctors }).end();
    } catch (error) {
      console.error(error);
      return serverErrorResponse(res);
    }
  }
);

module.exports = {
  apiRouter: router,
};
