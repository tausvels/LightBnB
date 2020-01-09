const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

//---- CONNECTING TO DB ----------- //
const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
})
///--------- TEST RUN --------------- //
/*
const queryString = `SELECT reservations.* as all_propperties FROM reservations LIMIT 5`;
pool
  .query(queryString)
  .then(res => {
    res.rows.forEach(item => {
      console.log(item);
    })
    pool.end();
  })
  .catch((err) => console.error(err));
*/
  /// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  /*
  let user;
  for (const userId in users) {
    user = users[userId];
    if (user.email.toLowerCase() === email.toLowerCase()) {
      break;
    } else {
      user = null;
    }
  }
  return Promise.resolve(user);
  */
 // ------ MODIFIED --------------
 const queryString = `
  SELECT *  
  FROM users  
  WHERE users.email = $1
`;
  return (
    pool
      .query(queryString, [email])
      .then(res => res.rows[0])
      .catch(err => console.error(err))
    );
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  // return Promise.resolve(users[id]);
   // ------ MODIFIED --------------
 const queryString = `
 SELECT *  
 FROM users  
 WHERE users.id = $1
`;
 return (
   pool
     .query(queryString, [id])
     .then(res => res.rows[0])
     .catch(err => console.error(err))
   );
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  /*
  const userId = Object.keys(users).length + 1;
  user.id = userId;
  users[userId] = user;
  return Promise.resolve(user);
  */
 // --- MODIFIED ----
 const queryString = `INSERT INTO users (name, email, password) VALUES($1,$2,$3) RETURNING *`;
 return (
   pool
    .query(queryString, [user.name, user.email, user.password])
    .then(res => res.rows[0])
    .catch(err => console.error(err))
 );
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return getAllProperties(null, 2);
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = function(options, limit = 10) {
  const queryString = `
  SELECT properties.*, ROUND(avg(property_reviews.rating),1) as average_rating  
  FROM properties 
    JOIN property_reviews ON property_id = properties.id
  GROUP BY properties.id 
  LIMIT $1
`;
  return (
    pool
      .query(queryString, [limit])
      .then(res => res.rows)
      .catch(err => console.error(err))
    );
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
