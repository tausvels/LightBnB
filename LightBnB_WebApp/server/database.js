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
 const queryString = `SELECT * FROM users WHERE users.id = $1`;
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
  //return getAllProperties(null, 2);
  const queryString = 
  `
    SELECT properties.*, reservations.*, avg(rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id 
    WHERE reservations.guest_id = $1
    AND reservations.end_date < now()::date
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2;
  `;
  return (
    pool
    .query(queryString, [guest_id, limit])
    .then(res => res.rows)
    .catch(err => console.error(err))
  )
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
    const queryParams = [];
    const base = 10;
    let counter = 0;
    let queryString = `
      SELECT properties.*, avg(property_reviews.rating) as average_rating
      FROM properties
        JOIN property_reviews ON properties.id = property_reviews.property_id  
    `;
  
    if (options.city) {
      counter++;
      queryParams.push(`%${options.city}%`);
      queryString += `WHERE city ILIKE $${queryParams.length} 
      `;
    }
  
    if (options.owner_id) {
      counter++;
      queryParams.push(options.owner_id);
      if (counter === 2) {
        queryString += `AND owner_id = $${queryParams.length} 
        `;
        console.log("Got here!");
      } else if (counter === 1) {
        queryString += `WHERE owner_id = $${queryParams.length} 
        `;
      }
    }
  
    if (options.minimum_price_per_night && options.maximum_price_per_night) {
      counter += 2;
      console.log("string ?", Number.isInteger(options.maximum_price_per_night));
      const min = (Number(options.minimum_price_per_night, base) * 100);
      const max = (Number(options.maximum_price_per_night, base) * 100);
      queryParams.push(min);
      queryString += `AND cost_per_night >= $${queryParams.length} 
      `;
      queryParams.push(max);
      queryString += `AND cost_per_night <= $${queryParams.length} 
      `;
    }
  
    queryString += `GROUP BY properties.id
    `;
  
    if (options.minimum_rating) {
      counter++;
      queryParams.push(options.minimum_rating);
      queryString += `HAVING AVG(property_reviews.rating) >= $${queryParams.length} 
      `;
    }
  
    queryParams.push(limit);
    queryString += `ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;

  return (
    pool
      .query(queryString, queryParams)
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
  // const propertyId = Object.keys(properties).length + 1;
  // property.id = propertyId;
  // properties[propertyId] = property;
  const propParam = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    Number(property.cost_per_night) * 100,
    Number(property.parking_spaces),
    Number(property.number_of_bathrooms), 
    Number(property.number_of_bedrooms),
    property.country,
    property.street, 
    property.city,
    property.province,
    property.post_code,
    true
  ];
  const queryString = 
  `INSERT INTO properties 
      (
        owner_id, title, description, thumbnail_photo_url, cover_photo_url,
        cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms,
        country, street, city, province, post_code, active
      ) 
    VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
    RETURNING *
  `;
  return (
    pool
      .query(queryString, propParam)
      .then(res => res.rows[0])
      .then(res => console.log('Listing successfully created'))
      .catch(err => console.error(err))
  );
}
exports.addProperty = addProperty;
