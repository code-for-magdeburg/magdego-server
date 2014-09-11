var development = {
  mongodb_host: 'localhost',
  mongodb_database: 'test',

  num_nearest_stations: 10,

  port: 3000,

  env : global.process.env.NODE_ENV || 'development'
};

var production = {
  mongodb_host: 'localhost',
  mongodb_database: 'magdego',

  port: 80,

  num_nearest_stations: 10,
  env : global.process.env.NODE_ENV || 'production'
};

exports.Config = global.process.env.NODE_ENV === 'production' ? production : development;
