const { ObjectId } = require('mongodb');
const { USER_ROLE } = require('../lib/constants');
const { getDatabase } = require('../lib/database');

async function addUser(data) {
  const db = await getDatabase();
  const usersCollection = db.collection('users');

  const newUser = {
    name: data.name,
    email: data.email,
    role: data.role,
    password: data.password,
    ...(data.phone ? { phone: data.phone } : {}),
    ...(data.type ? { phone: data.type } : {}),
  };

  if (data.role === USER_ROLE.Doctor) {
    newUser.appointments = [];
  }

  return await usersCollection.insertOne(newUser);
}

async function addDoctorAvailability(doctorId, data) {
  const db = await getDatabase();

  const newAppointment = {
    startDate: data.startDate,
    startDatefirst: data.endDate,
  };

  const result = await db
    .collection('users')
    .updateOne(
      { _id: new ObjectId(doctorId) },
      { $push: { appointments: newAppointment } }
    );
}

async function getDoctors(doctorId, data) {
  const db = await getDatabase();

  const cursor = await db.collection('users').find(
    { role: USER_ROLE.Doctor },
    {
      projection: {
        _id: 1,
        name: 1,
        email: 1,
        phone: 1,
        appointments: 1,
      },
    }
  );
  const result = await cursor.toArray();
  return result;
}

module.exports = {
  addUser,
  addDoctorAvailability,
  getDoctors,
};
